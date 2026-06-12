let initialized = false;

export function init(TPP) {
  if (initialized) {
    return {
      applyMonoDither: TPP.applyImageExportMonoDither,
      applyPaletteDither: TPP.applyImageExportPaletteDither,
    };
  }
  initialized = true;

  const clampByte = function (value) {
    return Math.max(0, Math.min(255, Number(value) || 0));
  };
  const luminanceAt = function (data, offset) {
    return (
      data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114
    );
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
  const hashNoise = function (x, y) {
    const seed = ((x + 1) * 374761393 + (y + 1) * 668265263) >>> 0;
    const mixed = (seed ^ (seed >>> 13)) * 1274126177;
    return ((mixed ^ (mixed >>> 16)) >>> 0) / 4294967295;
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
  const applyErrorDiffusion = function (
    data,
    width,
    height,
    threshold,
    diffusion,
    divisor,
  ) {
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
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height)
            continue;
          work[nextY * width + nextX] += (error * item[2]) / divisor;
        }
      }
    }
  };
  const applyRandom = function (data, width, height, threshold) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const gray = luminanceAt(data, offset);
        const noise = (hashNoise(x, y) - 0.5) * 96;
        writeMono(data, offset, gray + noise >= threshold ? 255 : 0);
      }
    }
  };
  const applyPattern = function (data, width, height, threshold) {
    const matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    applyOrderedMatrix(data, width, height, threshold, matrix);
  };
  const applyHalftone = function (data, width, height, threshold) {
    const matrix = [
      [24, 10, 12, 26, 35, 47, 49, 37],
      [8, 0, 2, 14, 45, 59, 61, 51],
      [22, 6, 4, 16, 43, 57, 63, 53],
      [30, 20, 18, 28, 33, 41, 55, 39],
      [34, 46, 48, 36, 25, 11, 13, 27],
      [44, 58, 60, 50, 9, 1, 3, 15],
      [42, 56, 62, 52, 23, 7, 5, 17],
      [32, 40, 54, 38, 31, 21, 19, 29],
    ];
    applyOrderedMatrix(data, width, height, threshold, matrix);
  };
  const applyBlueNoise = function (data, width, height, threshold) {
    const matrix = [
      [0, 48, 12, 60, 3, 51, 15, 63],
      [32, 16, 44, 28, 35, 19, 47, 31],
      [8, 56, 4, 52, 11, 59, 7, 55],
      [40, 24, 36, 20, 43, 27, 39, 23],
      [2, 50, 14, 62, 1, 49, 13, 61],
      [34, 18, 46, 30, 33, 17, 45, 29],
      [10, 58, 6, 54, 9, 57, 5, 53],
      [42, 26, 38, 22, 41, 25, 37, 21],
    ];
    applyOrderedMatrix(data, width, height, threshold, matrix);
  };
  const applyPaletteOrderedMatrix = function (
    data,
    width,
    height,
    palette,
    matrix,
    strength,
  ) {
    const size = matrix.length || 1;
    const levels = size * size;
    const biasScale = Math.max(0, Number(strength) || 0);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const bias =
          ((matrix[y % size][x % size] + 0.5) / levels - 0.5) * biasScale;
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
  const applyPaletteErrorDiffusion = function (
    data,
    width,
    height,
    palette,
    diffusion,
    divisor,
  ) {
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
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height)
            continue;
          const nextIndex = (nextY * width + nextX) * 3;
          const factor = item[2] / divisor;
          work[nextIndex] += errorR * factor;
          work[nextIndex + 1] += errorG * factor;
          work[nextIndex + 2] += errorB * factor;
        }
      }
    }
  };
  const applyPaletteRandom = function (data, width, height, palette, strength) {
    const biasScale = Math.max(0, Number(strength) || 0);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const bias = (hashNoise(x, y) - 0.5) * biasScale;
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
  const paletteDitherers = {
    threshold: function (data, width, height, palette) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const swatch = nearestPaletteColor(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            palette,
          );
          data[offset] = swatch[0];
          data[offset + 1] = swatch[1];
          data[offset + 2] = swatch[2];
        }
      }
    },
    bayer2: function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [0, 2],
        [3, 1],
      ], 64);
    },
    bayer4: function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ], 64);
    },
    bayer8: function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [0, 32, 8, 40, 2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44, 4, 36, 14, 46, 6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3, 35, 11, 43, 1, 33, 9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47, 7, 39, 13, 45, 5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21],
      ], 64);
    },
    "floyd-steinberg": function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 7],
        [-1, 1, 3],
        [0, 1, 5],
        [1, 1, 1],
      ], 16);
    },
    "jarvis-judice-ninke": function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 7],
        [2, 0, 5],
        [-2, 1, 3],
        [-1, 1, 5],
        [0, 1, 7],
        [1, 1, 5],
        [2, 1, 3],
        [-2, 2, 1],
        [-1, 2, 3],
        [0, 2, 5],
        [1, 2, 3],
        [2, 2, 1],
      ], 48);
    },
    stucki: function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 8],
        [2, 0, 4],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 8],
        [1, 1, 4],
        [2, 1, 2],
        [-2, 2, 1],
        [-1, 2, 2],
        [0, 2, 4],
        [1, 2, 2],
        [2, 2, 1],
      ], 42);
    },
    burkes: function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 8],
        [2, 0, 4],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 8],
        [1, 1, 4],
        [2, 1, 2],
      ], 32);
    },
    sierra: function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 5],
        [2, 0, 3],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 5],
        [1, 1, 4],
        [2, 1, 2],
        [-1, 2, 2],
        [0, 2, 3],
        [1, 2, 2],
      ], 32);
    },
    atkinson: function (data, width, height, palette) {
      applyPaletteErrorDiffusion(data, width, height, palette, [
        [1, 0, 1],
        [2, 0, 1],
        [-1, 1, 1],
        [0, 1, 1],
        [1, 1, 1],
        [0, 2, 1],
      ], 8);
    },
    halftone: function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [24, 10, 12, 26, 35, 47, 49, 37],
        [8, 0, 2, 14, 45, 59, 61, 51],
        [22, 6, 4, 16, 43, 57, 63, 53],
        [30, 20, 18, 28, 33, 41, 55, 39],
        [34, 46, 48, 36, 25, 11, 13, 27],
        [44, 58, 60, 50, 9, 1, 3, 15],
        [42, 56, 62, 52, 23, 7, 5, 17],
        [32, 40, 54, 38, 31, 21, 19, 29],
      ], 64);
    },
    "blue-noise": function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [0, 48, 12, 60, 3, 51, 15, 63],
        [32, 16, 44, 28, 35, 19, 47, 31],
        [8, 56, 4, 52, 11, 59, 7, 55],
        [40, 24, 36, 20, 43, 27, 39, 23],
        [2, 50, 14, 62, 1, 49, 13, 61],
        [34, 18, 46, 30, 33, 17, 45, 29],
        [10, 58, 6, 54, 9, 57, 5, 53],
        [42, 26, 38, 22, 41, 25, 37, 21],
      ], 64);
    },
    random: function (data, width, height, palette) {
      applyPaletteRandom(data, width, height, palette, 96);
    },
    pattern: function (data, width, height, palette) {
      applyPaletteOrderedMatrix(data, width, height, palette, [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ], 64);
    },
  };
  const ditherers = {
    threshold: function (data, width, height, threshold) {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          writeMono(data, offset, luminanceAt(data, offset) >= threshold ? 255 : 0);
        }
      }
    },
    bayer2: function (data, width, height, threshold) {
      applyOrderedMatrix(data, width, height, threshold, [
        [0, 2],
        [3, 1],
      ]);
    },
    bayer4: function (data, width, height, threshold) {
      applyOrderedMatrix(data, width, height, threshold, [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ]);
    },
    bayer8: function (data, width, height, threshold) {
      applyOrderedMatrix(data, width, height, threshold, [
        [0, 32, 8, 40, 2, 34, 10, 42],
        [48, 16, 56, 24, 50, 18, 58, 26],
        [12, 44, 4, 36, 14, 46, 6, 38],
        [60, 28, 52, 20, 62, 30, 54, 22],
        [3, 35, 11, 43, 1, 33, 9, 41],
        [51, 19, 59, 27, 49, 17, 57, 25],
        [15, 47, 7, 39, 13, 45, 5, 37],
        [63, 31, 55, 23, 61, 29, 53, 21],
      ]);
    },
    "floyd-steinberg": function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 7],
          [-1, 1, 3],
          [0, 1, 5],
          [1, 1, 1],
        ],
        16,
      );
    },
    "jarvis-judice-ninke": function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 7],
          [2, 0, 5],
          [-2, 1, 3],
          [-1, 1, 5],
          [0, 1, 7],
          [1, 1, 5],
          [2, 1, 3],
          [-2, 2, 1],
          [-1, 2, 3],
          [0, 2, 5],
          [1, 2, 3],
          [2, 2, 1],
        ],
        48,
      );
    },
    stucki: function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 8],
          [2, 0, 4],
          [-2, 1, 2],
          [-1, 1, 4],
          [0, 1, 8],
          [1, 1, 4],
          [2, 1, 2],
          [-2, 2, 1],
          [-1, 2, 2],
          [0, 2, 4],
          [1, 2, 2],
          [2, 2, 1],
        ],
        42,
      );
    },
    burkes: function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 8],
          [2, 0, 4],
          [-2, 1, 2],
          [-1, 1, 4],
          [0, 1, 8],
          [1, 1, 4],
          [2, 1, 2],
        ],
        32,
      );
    },
    sierra: function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 5],
          [2, 0, 3],
          [-2, 1, 2],
          [-1, 1, 4],
          [0, 1, 5],
          [1, 1, 4],
          [2, 1, 2],
          [-1, 2, 2],
          [0, 2, 3],
          [1, 2, 2],
        ],
        32,
      );
    },
    atkinson: function (data, width, height, threshold) {
      applyErrorDiffusion(
        data,
        width,
        height,
        threshold,
        [
          [1, 0, 1],
          [2, 0, 1],
          [-1, 1, 1],
          [0, 1, 1],
          [1, 1, 1],
          [0, 2, 1],
        ],
        8,
      );
    },
    halftone: applyHalftone,
    "blue-noise": applyBlueNoise,
    random: applyRandom,
    pattern: applyPattern,
  };

  TPP.applyImageExportMonoDither = function (data, width, height, options) {
    const config = options || {};
    const algorithm = String(config.algorithm || "threshold");
    const threshold = clampByte(config.threshold == null ? 128 : config.threshold);
    const apply =
      ditherers[algorithm === "none" ? "threshold" : algorithm] ||
      ditherers.threshold;
    apply(data, width, height, threshold);
  };
  TPP.applyImageExportPaletteDither = function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    if (!Array.isArray(palette) || !palette.length) return;
    const config = options || {};
    const algorithm = String(config.algorithm || "threshold");
    const apply =
      paletteDitherers[algorithm === "none" ? "threshold" : algorithm] ||
      paletteDitherers.threshold;
    apply(data, width, height, palette);
  };

  return {
    applyMonoDither: TPP.applyImageExportMonoDither,
    applyPaletteDither: TPP.applyImageExportPaletteDither,
  };
}
