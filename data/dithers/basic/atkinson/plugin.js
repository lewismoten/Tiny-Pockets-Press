(function () {
  const name = "Atkinson";
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
  const applyErrorDiffusion = function (data, width, height, threshold, diffusion, divisor) {
    const work = new Float32Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        work[y * width + x] = luminanceAt(data, offset);
      }
    }
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const oldPixel = work[index];
        const newPixel = oldPixel >= threshold ? 255 : 0;
        const error = oldPixel - newPixel;
        const offset = index * 4;
        writeMono(data, offset, newPixel);
        for (let i = 0; i < diffusion.length; i += 1) {
          const item = diffusion[i];
          const nextX = x + item[0];
          const nextY = y + item[1];
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          work[nextY * width + nextX] += (error * item[2]) / divisor;
        }
      }
    }
  };
  const applyPaletteErrorDiffusion = function (data, width, height, palette, diffusion, divisor) {
    const work = new Float32Array(width * height * 3);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const index = (y * width + x) * 3;
        work[index] = data[offset];
        work[index + 1] = data[offset + 1];
        work[index + 2] = data[offset + 2];
      }
    }
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x;
        const workIndex = pixelIndex * 3;
        const offset = pixelIndex * 4;
        const swatch = nearestPaletteColor(
          work[workIndex],
          work[workIndex + 1],
          work[workIndex + 2],
          palette,
        );
        const errorR = work[workIndex] - swatch[0];
        const errorG = work[workIndex + 1] - swatch[1];
        const errorB = work[workIndex + 2] - swatch[2];
        data[offset] = swatch[0];
        data[offset + 1] = swatch[1];
        data[offset + 2] = swatch[2];
        for (let i = 0; i < diffusion.length; i += 1) {
          const item = diffusion[i];
          const nextX = x + item[0];
          const nextY = y + item[1];
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
          const nextIndex = (nextY * width + nextX) * 3;
          const factor = item[2] / divisor;
          work[nextIndex] += errorR * factor;
          work[nextIndex + 1] += errorG * factor;
          work[nextIndex + 2] += errorB * factor;
        }
      }
    }
  };
  const diffusion =
      [
              [
                      1,
                      0,
                      1
              ],
              [
                      2,
                      0,
                      1
              ],
              [
                      -1,
                      1,
                      1
              ],
              [
                      0,
                      1,
                      1
              ],
              [
                      1,
                      1,
                      1
              ],
              [
                      0,
                      2,
                      1
              ]
      ];
  try {
    registerDither({
      id: "atkinson",
      name: name,
      kind: "both",
      applyMono: function (data, width, height, options) {
        const threshold = Math.max(0, Math.min(255, Number((options || {}).threshold) || 128));
        applyErrorDiffusion(data, width, height, threshold, diffusion, 8);
      },
      applyPalette: function (data, width, height, palette) {
        if (!Array.isArray(palette) || !palette.length) return;
        applyPaletteErrorDiffusion(data, width, height, palette, diffusion, 8);
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
