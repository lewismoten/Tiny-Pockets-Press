(function () {
  const name = "Blue-noise";
  const baseMessage = `Dither "${name}" could not register.`;
  const logError = function (message, err) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      if (arguments.length > 1) console.error(message, err);
      else console.error(message);
    }
  };
  const registerDither = window.TPP && window.TPP.registerDither;
  if (typeof registerDither !== "function") {
    logError(`${baseMessage} TPP.registerDither not found.`);
    return;
  }
  const luminanceAt = function (data, offset) {
    return data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  };
  const writeMono = function (data, offset, value) {
    const bit = value >= 128 ? 255 : 0;
    data[offset] = bit;
    data[offset + 1] = bit;
    data[offset + 2] = bit;
  };
  const clampColor = function (value) {
    return Math.max(0, Math.min(255, Number(value) || 0));
  };
  const nearestPaletteColor = function (r, g, b, palette) {
    let best = palette[0] || [0, 0, 0];
    let bestDistance = Infinity;
    for (let i = 0; i < palette.length; i += 1) {
      const swatch = palette[i];
      const dr = r - swatch[0];
      const dg = g - swatch[1];
      const db = b - swatch[2];
      const distance = dr * dr + dg * dg + db * db;
      if (distance < bestDistance) {
        best = swatch;
        bestDistance = distance;
      }
    }
    return best;
  };
  const applyOrderedMatrix = function (data, width, height, threshold, matrix) {
    const size = matrix.length || 1;
    const levels = size * size;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const gray = luminanceAt(data, offset);
        const bias = ((matrix[y % size][x % size] + 0.5) / levels - 0.5) * 255;
        writeMono(data, offset, gray + bias >= threshold ? 255 : 0);
      }
    }
  };
  const applyPaletteOrderedMatrix = function (data, width, height, palette, matrix, strength) {
    const size = matrix.length || 1;
    const levels = size * size;
    const biasScale = Math.max(0, Number(strength) || 0);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const bias = ((matrix[y % size][x % size] + 0.5) / levels - 0.5) * biasScale;
        const swatch = nearestPaletteColor(
          clampColor(data[offset] + bias),
          clampColor(data[offset + 1] + bias),
          clampColor(data[offset + 2] + bias),
          palette,
        );
        data[offset] = swatch[0];
        data[offset + 1] = swatch[1];
        data[offset + 2] = swatch[2];
      }
    }
  };
  const matrix =
      [
              [
                      0,
                      48,
                      12,
                      60,
                      3,
                      51,
                      15,
                      63
              ],
              [
                      32,
                      16,
                      44,
                      28,
                      35,
                      19,
                      47,
                      31
              ],
              [
                      8,
                      56,
                      4,
                      52,
                      11,
                      59,
                      7,
                      55
              ],
              [
                      40,
                      24,
                      36,
                      20,
                      43,
                      27,
                      39,
                      23
              ],
              [
                      2,
                      50,
                      14,
                      62,
                      1,
                      49,
                      13,
                      61
              ],
              [
                      34,
                      18,
                      46,
                      30,
                      33,
                      17,
                      45,
                      29
              ],
              [
                      10,
                      58,
                      6,
                      54,
                      9,
                      57,
                      5,
                      53
              ],
              [
                      42,
                      26,
                      38,
                      22,
                      41,
                      25,
                      37,
                      21
              ]
      ];
  try {
    registerDither({
      id: "blue-noise",
      name: name,
      kind: "both",
      applyMono: function (data, width, height, options) {
        const threshold = Math.max(0, Math.min(255, Number((options || {}).threshold) || 128));
        applyOrderedMatrix(data, width, height, threshold, matrix);
      },
      applyPalette: function (data, width, height, palette) {
        if (!Array.isArray(palette) || !palette.length) return;
        applyPaletteOrderedMatrix(data, width, height, palette, matrix, 64);
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
