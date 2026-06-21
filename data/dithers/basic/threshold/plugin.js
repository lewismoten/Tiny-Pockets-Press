(function () {
  const name = "Threshold";
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
  try {
    registerDither({
      id: "threshold",
      name: name,
      kind: "both",
      applyMono: function (data, width, height, options) {
        const threshold = Math.max(0, Math.min(255, Number((options || {}).threshold) || 128));
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4;
            writeMono(data, offset, luminanceAt(data, offset) >= threshold ? 255 : 0);
          }
        }
      },
      applyPalette: function (data, width, height, palette) {
        if (!Array.isArray(palette) || !palette.length) return;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4;
            const swatch = nearestPaletteColor(data[offset], data[offset + 1], data[offset + 2], palette);
            data[offset] = swatch[0];
            data[offset + 1] = swatch[1];
            data[offset + 2] = swatch[2];
          }
        }
      },
    });
  } catch (err) {
    logError(baseMessage, err);
  }
})();
