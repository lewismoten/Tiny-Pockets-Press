(function () {
  const name = "Bayer 8x8";
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
                      32,
                      8,
                      40,
                      2,
                      34,
                      10,
                      42
              ],
              [
                      48,
                      16,
                      56,
                      24,
                      50,
                      18,
                      58,
                      26
              ],
              [
                      12,
                      44,
                      4,
                      36,
                      14,
                      46,
                      6,
                      38
              ],
              [
                      60,
                      28,
                      52,
                      20,
                      62,
                      30,
                      54,
                      22
              ],
              [
                      3,
                      35,
                      11,
                      43,
                      1,
                      33,
                      9,
                      41
              ],
              [
                      51,
                      19,
                      59,
                      27,
                      49,
                      17,
                      57,
                      25
              ],
              [
                      15,
                      47,
                      7,
                      39,
                      13,
                      45,
                      5,
                      37
              ],
              [
                      63,
                      31,
                      55,
                      23,
                      61,
                      29,
                      53,
                      21
              ]
      ];
  try {
    registerDither({
      id: "bayer8",
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
