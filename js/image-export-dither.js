let initialized = false;

export function init(TPP) {
  if (initialized) {
    return {
      applyMonoDither: TPP.applyImageExportMonoDither,
      applyPaletteDither: TPP.applyImageExportPaletteDither,
      buildCustomCharsetSheet: TPP.buildImageExportCustomCharsetSheet,
    };
  }
  initialized = true;
  TPP.imageExportC64CellCache = TPP.imageExportC64CellCache || new Map();
  TPP.IMAGE_EXPORT_C64_CELL_CACHE_LIMIT =
    TPP.IMAGE_EXPORT_C64_CELL_CACHE_LIMIT || 4096;

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
  const getCachedC64Cell = function (key) {
    const cacheKey = String(key || "");
    if (!cacheKey || !TPP.imageExportC64CellCache.has(cacheKey)) return null;
    const entry = TPP.imageExportC64CellCache.get(cacheKey);
    TPP.imageExportC64CellCache.delete(cacheKey);
    TPP.imageExportC64CellCache.set(cacheKey, entry);
    return entry || null;
  };
  const setCachedC64Cell = function (key, value) {
    const cacheKey = String(key || "");
    if (!cacheKey || !value) return value || null;
    if (TPP.imageExportC64CellCache.has(cacheKey)) {
      TPP.imageExportC64CellCache.delete(cacheKey);
    }
    TPP.imageExportC64CellCache.set(cacheKey, value);
    while (
      TPP.imageExportC64CellCache.size > TPP.IMAGE_EXPORT_C64_CELL_CACHE_LIMIT
    ) {
      const oldest = TPP.imageExportC64CellCache.keys().next();
      if (oldest && !oldest.done) {
        TPP.imageExportC64CellCache.delete(oldest.value);
      } else {
        break;
      }
    }
    return value;
  };
  const hashNumbers = function (values, seed) {
    let hash = seed == null ? 2166136261 : seed >>> 0;
    const list = Array.isArray(values) || ArrayBuffer.isView(values) ? values : [];
    for (let i = 0; i < list.length; i += 1) {
      hash ^= Number(list[i]) & 255;
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  };
  const hashPalette = function (palette) {
    let hash = 2166136261;
    (Array.isArray(palette) ? palette : []).forEach(function (swatch) {
      hash = hashNumbers(swatch, hash);
    });
    return hash.toString(16);
  };
  const hashGlyphCatalog = function (glyphs) {
    let hash = 2166136261;
    (Array.isArray(glyphs) ? glyphs : []).forEach(function (glyph) {
      hash = hashNumbers(glyph, hash);
    });
    return hash.toString(16);
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
  const yieldToUi = function () {
    return new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });
  };
  const makeUiYieldController = function (budgetMs) {
    const maxBudget = Math.max(1, Number(budgetMs) || 2);
    let lastYieldAt =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    return async function () {
      const now =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      if (now - lastYieldAt < maxBudget) return false;
      await yieldToUi();
      lastYieldAt =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      return true;
    };
  };
  const reportProgress = function (config, info) {
    if (!config || typeof config.onProgress !== "function") return;
    const now =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    const last = Number(config._lastProgressAt) || 0;
    const total = Math.max(1, Number(info && info.total) || 1);
    const completed = Math.max(
      0,
      Math.min(total, Number(info && info.completed) || 0),
    );
    if (
      completed < total &&
      now - last < Math.max(16, Number(config.progressIntervalMs) || 48)
    ) {
      return;
    }
    config._lastProgressAt = now;
    config.onProgress(
      Object.assign({}, info, {
        completed: completed,
        total: total,
        percent: Math.max(0, Math.min(100, Math.round((completed / total) * 100))),
      }),
    );
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
  const applyC64BayerPrepass = function (data, width, height, palette) {
    if (!data || !width || !height || !Array.isArray(palette) || !palette.length) {
      return;
    }
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
  };
  const quadrantMask = function (bits) {
    const mask = new Uint8Array(64);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const quadrant = (y < 4 ? 0 : 2) + (x < 4 ? 0 : 1);
        mask[y * 8 + x] = bits[quadrant] ? 1 : 0;
      }
    }
    return mask;
  };
  const makeMask = function (fn) {
    const mask = new Uint8Array(64);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        mask[y * 8 + x] = fn(x, y) ? 1 : 0;
      }
    }
    return mask;
  };
  const petsciiGlyphs = [];
  for (let bits = 0; bits < 16; bits += 1) {
    petsciiGlyphs.push(
      quadrantMask([
        bits & 1,
        bits & 2,
        bits & 4,
        bits & 8,
      ]),
    );
  }
  petsciiGlyphs.push(makeMask(function (x) {
    return x < 2;
  }));
  petsciiGlyphs.push(makeMask(function (x) {
    return x >= 6;
  }));
  petsciiGlyphs.push(makeMask(function (_x, y) {
    return y < 2;
  }));
  petsciiGlyphs.push(makeMask(function (_x, y) {
    return y >= 6;
  }));
  petsciiGlyphs.push(makeMask(function (x, y) {
    return x === y || x === y - 1 || x === y + 1;
  }));
  petsciiGlyphs.push(makeMask(function (x, y) {
    return x + y === 7 || x + y === 6 || x + y === 8;
  }));
  petsciiGlyphs.push(makeMask(function (x, y) {
    return (x + y) % 2 === 0;
  }));
  const rasterizeGlyphMask = function (char) {
    const source = document.createElement("canvas");
    source.width = 16;
    source.height = 16;
    const ctx = source.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.clearRect(0, 0, source.width, source.height);
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      'bold 14px "C64 Pro Mono", "Pet Me 64", "Courier New", monospace';
    ctx.fillText(String(char || " "), source.width / 2, source.height / 2 + 0.5);
    const image = ctx.getImageData(0, 0, source.width, source.height).data;
    const mask = new Uint8Array(64);
    let used = 0;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        let alpha = 0;
        for (let sy = 0; sy < 2; sy += 1) {
          for (let sx = 0; sx < 2; sx += 1) {
            const px = x * 2 + sx;
            const py = y * 2 + sy;
            alpha += image[(py * source.width + px) * 4 + 3];
          }
        }
        const bit = alpha >= 128 ? 1 : 0;
        mask[y * 8 + x] = bit;
        used += bit;
      }
    }
    return used ? mask : null;
  };
  const petsciiFullGlyphChars = Array.from(
    new Set(
      (
        " ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        "0123456789" +
        "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" +
        "+-*/=<>()[]{}#%&@" +
        ".,:;!?\"'" +
        "/\\\\|_" +
        "<>^v" +
        "oOxX"
      ).split(""),
    ),
  );
  const petsciiFullGlyphs = petsciiGlyphs
    .slice()
    .concat(
      petsciiFullGlyphChars
        .map(rasterizeGlyphMask)
        .filter(function (mask) {
          return mask && mask.some(function (bit) {
            return bit;
          });
        }),
    );
  const fixedGlyphCatalogHashes = {
    blocks: hashGlyphCatalog(petsciiGlyphs),
    full: hashGlyphCatalog(petsciiFullGlyphs),
  };
  const petsciiGlyphCodes = new Uint8Array(
    petsciiGlyphs.map(function (_mask, index) {
      if (index < 16) {
        return 0x20 + index;
      }
      const extraCodes = [0x7c, 0x7c, 0x5f, 0x5f, 0x5c, 0x2f, 0x23];
      return extraCodes[index - 16] || 0x20;
    }),
  );
  const petsciiFullGlyphCodes = new Uint8Array(
    petsciiGlyphCodes.length + petsciiFullGlyphChars.length,
  );
  petsciiFullGlyphCodes.set(petsciiGlyphCodes, 0);
  for (let i = 0; i < petsciiFullGlyphChars.length; i += 1) {
    petsciiFullGlyphCodes[ petsciiGlyphCodes.length + i ] =
      petsciiFullGlyphChars[i].charCodeAt(0) || 0x20;
  }
  const selectSeqGlyphCatalog = function (dithering) {
    if (dithering === "c64-petscii-full" || dithering === "c64-custom-charset") {
      return {
        glyphs: petsciiFullGlyphs,
        codes: petsciiFullGlyphCodes,
        hash: fixedGlyphCatalogHashes.full,
      };
    }
    return {
      glyphs: petsciiGlyphs,
      codes: petsciiGlyphCodes,
      hash: fixedGlyphCatalogHashes.blocks,
    };
  };
  const buildImageExportSeqScreen = function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    if (!Array.isArray(palette) || !palette.length) return null;
    const mode = String((options || {}).dithering || "c64-petscii");
    const sequence = selectSeqGlyphCatalog(mode);
    const glyphCatalog = sequence.glyphs;
    const glyphCodes = sequence.codes;
    const glyphHash = sequence.hash;
    const cellSize = 8;
    const cols = Math.max(1, Math.floor(width / cellSize));
    const rows = Math.max(1, Math.floor(height / cellSize));
    const paletteHash = hashPalette(palette);
    const bytes = new Uint8Array(cols * rows);
    const colorLimit = Math.max(2, Math.min(6, palette.length));
    const globalBackgroundIndex = chooseGlobalBackgroundIndex(
      data,
      width,
      height,
      palette,
      { colorLimit: colorLimit },
    );
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cellX = col * cellSize;
        const cellY = row * cellSize;
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const candidates = paletteCellCandidates(
          pixels,
          palette,
          colorLimit,
        );
        const fit = bestTwoColorCellFit(
          pixels,
          blockWidth,
          blockHeight,
          palette,
          candidates,
          { backgroundIndex: globalBackgroundIndex },
        );
        let bestIndex = 0;
        let bestError = Infinity;
        for (let glyphIndex = 0; glyphIndex < glyphCatalog.length; glyphIndex += 1) {
          const glyph = glyphCatalog[glyphIndex];
          const totalError = scoreMaskAgainstCell(
            glyph,
            blockWidth,
            blockHeight,
            fit.bgErrors,
            fit.fgErrors,
          );
          if (totalError < bestError) {
            bestError = totalError;
            bestIndex = glyphIndex;
          }
        }
        bytes[row * cols + col] = glyphCodes[bestIndex] || 0x20;
      }
    }
    return bytes;
  };
  TPP.buildImageExportSeqScreen = buildImageExportSeqScreen;
  const paletteCellScores = function (pixels, palette) {
    return palette.map(function (swatch, index) {
      let total = 0;
      for (let i = 0; i < pixels.length; i += 3) {
        const dr = pixels[i] - swatch[0];
        const dg = pixels[i + 1] - swatch[1];
        const db = pixels[i + 2] - swatch[2];
        total += dr * dr + dg * dg + db * db;
      }
      return { index: index, total: total };
    })
      .sort(function (a, b) {
        return a.total - b.total;
      });
  };
  const paletteCellCandidates = function (pixels, palette, limit) {
    const scored = paletteCellScores(pixels, palette);
    return scored
      .slice(0, Math.max(1, Math.min(Number(limit) || 1, scored.length)))
      .map(function (entry) {
        return entry.index;
      });
  };
  const classifySolidPaletteCell = function (pixels, palette, options) {
    if (!pixels || !pixels.length || !Array.isArray(palette) || !palette.length) {
      return null;
    }
    const config = options || {};
    const threshold = Math.max(
      0.5,
      Math.min(1, Number(config.solidCellThreshold) || 0.9375),
    );
    const counts = new Uint16Array(palette.length);
    const totalPixels = Math.floor(pixels.length / 3);
    if (!totalPixels) return null;
    for (let i = 0; i < pixels.length; i += 3) {
      let bestIndex = 0;
      let bestError = Infinity;
      for (let paletteIndex = 0; paletteIndex < palette.length; paletteIndex += 1) {
        const swatch = palette[paletteIndex];
        const dr = pixels[i] - swatch[0];
        const dg = pixels[i + 1] - swatch[1];
        const db = pixels[i + 2] - swatch[2];
        const error = dr * dr + dg * dg + db * db;
        if (error < bestError) {
          bestError = error;
          bestIndex = paletteIndex;
        }
      }
      counts[bestIndex] += 1;
    }
    let dominantIndex = 0;
    let dominantCount = counts[0] || 0;
    for (let i = 1; i < counts.length; i += 1) {
      if (counts[i] > dominantCount) {
        dominantCount = counts[i];
        dominantIndex = i;
      }
    }
    const coverage = dominantCount / totalPixels;
    if (coverage < threshold) return null;
    return {
      colorIndex: dominantIndex,
      coverage: coverage,
      totalPixels: totalPixels,
      dominantCount: dominantCount,
    };
  };
  const dominantPaletteCellColor = function (pixels, palette) {
    if (!pixels || !pixels.length || !Array.isArray(palette) || !palette.length) {
      return { colorIndex: 0, coverage: 0 };
    }
    const counts = new Uint16Array(palette.length);
    const totalPixels = Math.floor(pixels.length / 3);
    if (!totalPixels) {
      return { colorIndex: 0, coverage: 0 };
    }
    for (let i = 0; i < pixels.length; i += 3) {
      let bestIndex = 0;
      let bestError = Infinity;
      for (let paletteIndex = 0; paletteIndex < palette.length; paletteIndex += 1) {
        const swatch = palette[paletteIndex];
        const dr = pixels[i] - swatch[0];
        const dg = pixels[i + 1] - swatch[1];
        const db = pixels[i + 2] - swatch[2];
        const error = dr * dr + dg * dg + db * db;
        if (error < bestError) {
          bestError = error;
          bestIndex = paletteIndex;
        }
      }
      counts[bestIndex] += 1;
    }
    let dominantIndex = 0;
    let dominantCount = counts[0] || 0;
    for (let i = 1; i < counts.length; i += 1) {
      if (counts[i] > dominantCount) {
        dominantCount = counts[i];
        dominantIndex = i;
      }
    }
    return {
      colorIndex: dominantIndex,
      coverage: dominantCount / totalPixels,
    };
  };
  const petsciiMaskBit = function (mask, x, y, width, height) {
    const glyphX = Math.max(
      0,
      Math.min(7, Math.floor((x * 8) / Math.max(1, width))),
    );
    const glyphY = Math.max(
      0,
      Math.min(7, Math.floor((y * 8) / Math.max(1, height))),
    );
    return mask[glyphY * 8 + glyphX];
  };
  const maskKey = function (mask) {
    return Array.from(mask || [])
      .map(function (bit) {
        return bit ? "1" : "0";
      })
      .join("");
  };
  const maskHammingDistance = function (a, b) {
    const left = a || [];
    const right = b || [];
    const length = Math.max(left.length || 0, right.length || 0, 64);
    let distance = 0;
    for (let i = 0; i < length; i += 1) {
      if ((left[i] ? 1 : 0) !== (right[i] ? 1 : 0)) {
        distance += 1;
      }
    }
    return distance;
  };
  const maskDifferenceScore = function (a, b) {
    const left = a || [];
    const right = b || [];
    const diffMap = new Uint8Array(64);
    const diffPositions = [];
    let minX = 8;
    let minY = 8;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const index = y * 8 + x;
        if ((left[index] ? 1 : 0) === (right[index] ? 1 : 0)) continue;
        diffMap[index] = 1;
        diffPositions.push(index);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (!diffPositions.length) return 0;
    let isolationPenalty = 0;
    let componentPenalty = 0;
    let components = 0;
    const visited = new Uint8Array(64);
    diffPositions.forEach(function (index) {
      const x = index % 8;
      const y = Math.floor(index / 8);
      let diffNeighbors = 0;
      let litNeighbors = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
          const neighborIndex = ny * 8 + nx;
          if (diffMap[neighborIndex]) diffNeighbors += 1;
          if ((left[neighborIndex] ? 1 : 0) || (right[neighborIndex] ? 1 : 0)) {
            litNeighbors += 1;
          }
        }
      }
      if (!diffNeighbors) {
        isolationPenalty += 1.75;
      } else if (diffNeighbors === 1) {
        isolationPenalty += 0.75;
      }
      if (!litNeighbors) {
        isolationPenalty += 1.25;
      } else if (litNeighbors <= 2) {
        isolationPenalty += 0.5;
      }
    });
    for (let i = 0; i < diffPositions.length; i += 1) {
      const start = diffPositions[i];
      if (visited[start]) continue;
      components += 1;
      const stack = [start];
      visited[start] = 1;
      while (stack.length) {
        const index = stack.pop();
        const x = index % 8;
        const y = Math.floor(index / 8);
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
            const neighborIndex = ny * 8 + nx;
            if (!diffMap[neighborIndex] || visited[neighborIndex]) continue;
            visited[neighborIndex] = 1;
            stack.push(neighborIndex);
          }
        }
      }
    }
    componentPenalty = Math.max(0, components - 1) * 1.5;
    const spanX = Math.max(1, maxX - minX + 1);
    const spanY = Math.max(1, maxY - minY + 1);
    const spreadPenalty = Math.max(0, spanX * spanY - diffPositions.length) / 10;
    return diffPositions.length + isolationPenalty + componentPenalty + spreadPenalty;
  };
  const maskFillRatio = function (mask) {
    const source = mask || [];
    let lit = 0;
    for (let i = 0; i < 64; i += 1) {
      lit += source[i] ? 1 : 0;
    }
    return lit / 64;
  };
  const maskLitCount = function (mask) {
    const source = mask || [];
    let lit = 0;
    for (let i = 0; i < 64; i += 1) {
      lit += source[i] ? 1 : 0;
    }
    return lit;
  };
  const maskDetailProtection = function (mask) {
    const fill = maskFillRatio(mask);
    const distanceFromHalf = Math.abs(fill - 0.5) * 2;
    return distanceFromHalf;
  };
  const maskBlockStructureScore = function (a, b) {
    const coarse4A = simplifyMask(a, 2);
    const coarse4B = simplifyMask(b, 2);
    const coarse2A = simplifyMask(a, 4);
    const coarse2B = simplifyMask(b, 4);
    const coarse4Diff = maskHammingDistance(coarse4A, coarse4B);
    const coarse2Diff = maskHammingDistance(coarse2A, coarse2B);
    const coarse4Shape = maskDifferenceScore(coarse4A, coarse4B);
    const coarse2Shape = maskDifferenceScore(coarse2A, coarse2B);
    return (
      coarse4Diff * 0.35 +
      coarse4Shape * 0.35 +
      coarse2Diff * 0.15 +
      coarse2Shape * 0.15
    );
  };
  const maskMacroDistance = function (a, b, blockSize) {
    const sourceA = a || new Uint8Array(64);
    const sourceB = b || new Uint8Array(64);
    const step = Math.max(1, Math.min(8, Number(blockSize) || 1));
    let distance = 0;
    for (let y0 = 0; y0 < 8; y0 += step) {
      for (let x0 = 0; x0 < 8; x0 += step) {
        let litA = 0;
        let litB = 0;
        let total = 0;
        for (let y = y0; y < Math.min(8, y0 + step); y += 1) {
          for (let x = x0; x < Math.min(8, x0 + step); x += 1) {
            total += 1;
            litA += sourceA[y * 8 + x] ? 1 : 0;
            litB += sourceB[y * 8 + x] ? 1 : 0;
          }
        }
        const bitA = litA >= total / 2 ? 1 : 0;
        const bitB = litB >= total / 2 ? 1 : 0;
        if (bitA !== bitB) {
          distance += 1;
        }
      }
    }
    return distance;
  };
  const clusterMergeMetrics = function (
    source,
    target,
    originalMaskByKey,
    similarityBias,
  ) {
    const memberKeys = Array.isArray(source && source.members) && source.members.length
      ? source.members
      : [source && source.key];
    let totalScore = 0;
    let compared = 0;
    let worstScore = 0;
    let worstPixelDiff = 0;
    let worstMacro4 = 0;
    let worstMacro2 = 0;
    for (let i = 0; i < memberKeys.length; i += 1) {
      const memberKey = memberKeys[i];
      const originalMask = originalMaskByKey.get(memberKey) || source.mask;
      if (
        Math.abs(maskLitCount(originalMask) - (target.litCount || maskLitCount(target.mask))) > 1
      ) {
        return null;
      }
      const diffCount = maskHammingDistance(originalMask, target.mask);
      const shapeScore = maskDifferenceScore(originalMask, target.mask);
      const blockScore = maskBlockStructureScore(originalMask, target.mask);
      const macro4 = maskMacroDistance(originalMask, target.mask, 2);
      const macro2 = maskMacroDistance(originalMask, target.mask, 4);
      const similarityScore =
        diffCount * (1 - similarityBias) * 0.45 +
        shapeScore * similarityBias * 0.55 +
        blockScore * 0.6;
      totalScore += similarityScore;
      worstScore = Math.max(worstScore, similarityScore);
      worstPixelDiff = Math.max(worstPixelDiff, diffCount);
      worstMacro4 = Math.max(worstMacro4, macro4);
      worstMacro2 = Math.max(worstMacro2, macro2);
      compared += 1;
    }
    if (!compared) return null;
    return {
      score: worstScore * 0.7 + (totalScore / compared) * 0.3,
      worstPixelDiff: worstPixelDiff,
      worstMacro4: worstMacro4,
      worstMacro2: worstMacro2,
    };
  };
  const mergeGuardForProgress = function (progress, relaxLevel) {
    const stage = Math.max(0, Math.min(1, Number(progress) || 0));
    const relax = Math.max(0, Math.min(2, Number(relaxLevel) || 0));
    if (relax >= 2) return null;
    if (stage >= 0.8) {
      return relax === 0
        ? { pixel: 6, macro4: 3, macro2: 0 }
        : { pixel: 8, macro4: 5, macro2: 1 };
    }
    if (stage >= 0.6) {
      return relax === 0
        ? { pixel: 8, macro4: 5, macro2: 1 }
        : { pixel: 10, macro4: 7, macro2: 2 };
    }
    return relax === 0
      ? { pixel: 10, macro4: 7, macro2: 2 }
      : { pixel: 14, macro4: 10, macro2: 3 };
  };
  const solidGlyphMask = function () {
    const mask = new Uint8Array(64);
    mask.fill(1);
    return mask;
  };
  const simplifyMask = function (mask, cellSize) {
    const source = mask || new Uint8Array(64);
    const block = Math.max(1, Math.min(8, Number(cellSize) || 1));
    if (block <= 1) return source;
    const simplified = new Uint8Array(64);
    for (let y0 = 0; y0 < 8; y0 += block) {
      for (let x0 = 0; x0 < 8; x0 += block) {
        let lit = 0;
        let total = 0;
        for (let y = y0; y < Math.min(8, y0 + block); y += 1) {
          for (let x = x0; x < Math.min(8, x0 + block); x += 1) {
            total += 1;
            lit += source[y * 8 + x] ? 1 : 0;
          }
        }
        const fill = lit >= total / 2 ? 1 : 0;
        for (let y = y0; y < Math.min(8, y0 + block); y += 1) {
          for (let x = x0; x < Math.min(8, x0 + block); x += 1) {
            simplified[y * 8 + x] = fill;
          }
        }
      }
    }
    return simplified;
  };
  const selectVariedCharsetPatterns = function (stats, limit, bias) {
    const entries = Array.isArray(stats) ? stats.slice() : [];
    const maxPatterns = Math.max(1, Math.min(Number(limit) || 256, entries.length));
    if (entries.length <= maxPatterns) {
      return entries
        .sort(function (a, b) {
          if (b.count !== a.count) return b.count - a.count;
          return a.error - b.error;
        })
        .map(function (entry) {
          return entry.mask;
        });
    }
    const normalizedBias = clampByte(bias == null ? 128 : bias) / 255;
    const originalMaskByKey = new Map(
      entries.map(function (entry) {
        return [entry.key, entry.mask];
      }),
    );
    const enriched = entries.map(function (entry) {
      return {
        key: entry.key,
        mask: entry.mask,
        count: entry.count,
        error: entry.error,
        averageError: entry.count ? entry.error / entry.count : entry.error,
        members: [entry.key],
      };
    });
    const maxCount = enriched.reduce(function (best, entry) {
      return Math.max(best, entry.count || 0);
    }, 1);
    const minAverageError = enriched.reduce(function (best, entry) {
      return Math.min(best, entry.averageError);
    }, Infinity);
    const maxAverageError = enriched.reduce(function (best, entry) {
      return Math.max(best, entry.averageError);
    }, 0);
    const errorRange = Math.max(1e-6, maxAverageError - minAverageError);
    const utilityScore = function (entry) {
      const countScore = (entry.count || 0) / maxCount;
      const errorScore =
        1 - (entry.averageError - minAverageError) / errorRange;
      return countScore * 0.85 + errorScore * 0.15;
    };
    const similarityBias = 0.35 + normalizedBias * 0.4;
    const working = enriched.map(function (entry) {
      return Object.assign({}, entry, {
        utility: utilityScore(entry),
        detailProtection: maskDetailProtection(entry.mask),
        litCount: maskLitCount(entry.mask),
      });
    });
    const totalRemovals = Math.max(1, working.length - maxPatterns);
    while (working.length > maxPatterns) {
      let bestMerge = null;
      const reductionProgress =
        (totalRemovals - Math.max(0, working.length - maxPatterns)) / totalRemovals;
      for (let relaxLevel = 0; relaxLevel < 3 && !bestMerge; relaxLevel += 1) {
        const guard = mergeGuardForProgress(reductionProgress, relaxLevel);
        for (let i = 0; i < working.length; i += 1) {
          const source = working[i];
          for (let j = 0; j < working.length; j += 1) {
            if (i === j) continue;
            const target = working[j];
            if (
              target.utility < source.utility &&
              !(target.utility === source.utility && (target.count || 0) >= (source.count || 0))
            ) {
              continue;
            }
            const metrics = clusterMergeMetrics(
              source,
              target,
              originalMaskByKey,
              similarityBias,
            );
            if (metrics == null) continue;
            if (
              guard &&
              (
                metrics.worstPixelDiff > guard.pixel ||
                metrics.worstMacro4 > guard.macro4 ||
                metrics.worstMacro2 > guard.macro2
              )
            ) {
              continue;
            }
            const removalWeight =
              (1 - source.utility) * 6 +
              (1 - Math.min(1, (source.count || 0) / maxCount)) * 4 +
              (source.averageError - minAverageError) / errorRange;
            const detailWeight =
              source.detailProtection * 4 -
              target.detailProtection * 1.5;
            const mergeScore =
              metrics.score +
              removalWeight -
              detailWeight -
              target.utility * 2 -
              Math.min(2, ((target.count || 0) / maxCount) * 2);
            if (!bestMerge || mergeScore < bestMerge.score) {
              bestMerge = {
                sourceIndex: i,
                targetIndex: j,
                score: mergeScore,
                similarityScore: metrics.score,
              };
            }
          }
        }
      }
      if (!bestMerge) break;
      const source = working[bestMerge.sourceIndex];
      const target = working[bestMerge.targetIndex];
      const absorbedCount = source.count || 0;
      const absorbedError =
        (source.error || 0) + bestMerge.similarityScore * absorbedCount;
      target.count = (target.count || 0) + absorbedCount;
      target.error = (target.error || 0) + absorbedError;
      target.averageError = target.count ? target.error / target.count : target.error;
      target.members = (target.members || []).concat(source.members || []);
      target.utility = utilityScore(target);
      working.splice(bestMerge.sourceIndex, 1);
    }
    return working
      .slice()
      .sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        const utilityDiff = (b.utility || 0) - (a.utility || 0);
        if (Math.abs(utilityDiff) > 1e-6) return utilityDiff;
        return a.averageError - b.averageError;
      })
      .slice(0, maxPatterns)
      .map(function (entry) {
        return entry.mask;
      });
  };
  const selectVariedCharsetPatternsAsync = async function (
    stats,
    limit,
    bias,
    options,
  ) {
    const entries = Array.isArray(stats) ? stats.slice() : [];
    const maxPatterns = Math.max(1, Math.min(Number(limit) || 256, entries.length));
    const config = options || {};
    const maybeYield =
      typeof config.maybeYield === "function"
        ? config.maybeYield
        : async function () {};
    if (entries.length <= maxPatterns) {
      const direct = entries
        .sort(function (a, b) {
          if (b.count !== a.count) return b.count - a.count;
          return a.error - b.error;
        });
      return {
        charset: direct.map(function (entry) {
          return entry.mask;
        }),
        representativeByKey: new Map(
          direct.map(function (entry) {
            return [entry.key, entry.mask];
          }),
        ),
      };
    }
    const normalizedBias = clampByte(bias == null ? 128 : bias) / 255;
    const originalMaskByKey = new Map(
      entries.map(function (entry) {
        return [entry.key, entry.mask];
      }),
    );
    const enriched = entries.map(function (entry) {
      return {
        key: entry.key,
        mask: entry.mask,
        count: entry.count,
        error: entry.error,
        averageError: entry.count ? entry.error / entry.count : entry.error,
        members: [entry.key],
      };
    });
    const maxCount = enriched.reduce(function (best, entry) {
      return Math.max(best, entry.count || 0);
    }, 1);
    const minAverageError = enriched.reduce(function (best, entry) {
      return Math.min(best, entry.averageError);
    }, Infinity);
    const maxAverageError = enriched.reduce(function (best, entry) {
      return Math.max(best, entry.averageError);
    }, 0);
    const errorRange = Math.max(1e-6, maxAverageError - minAverageError);
    const utilityScore = function (entry) {
      const countScore = (entry.count || 0) / maxCount;
      const errorScore =
        1 - (entry.averageError - minAverageError) / errorRange;
      return countScore * 0.85 + errorScore * 0.15;
    };
    const similarityBias = 0.35 + normalizedBias * 0.4;
    const working = enriched.map(function (entry) {
      return Object.assign({}, entry, {
        utility: utilityScore(entry),
        detailProtection: maskDetailProtection(entry.mask),
        litCount: maskLitCount(entry.mask),
      });
    });
    const mergesNeeded = Math.max(0, working.length - maxPatterns);
    let mergesCompleted = 0;
    while (working.length > maxPatterns) {
      let bestMerge = null;
      const reductionProgress =
        mergesNeeded ? mergesCompleted / mergesNeeded : 1;
      for (let relaxLevel = 0; relaxLevel < 3 && !bestMerge; relaxLevel += 1) {
        const guard = mergeGuardForProgress(reductionProgress, relaxLevel);
        for (let i = 0; i < working.length; i += 1) {
          const source = working[i];
          for (let j = 0; j < working.length; j += 1) {
            if (i === j) continue;
            const target = working[j];
            if (
              target.utility < source.utility &&
              !(target.utility === source.utility && (target.count || 0) >= (source.count || 0))
            ) {
              continue;
            }
            const metrics = clusterMergeMetrics(
              source,
              target,
              originalMaskByKey,
              similarityBias,
            );
            if (metrics == null) continue;
            if (
              guard &&
              (
                metrics.worstPixelDiff > guard.pixel ||
                metrics.worstMacro4 > guard.macro4 ||
                metrics.worstMacro2 > guard.macro2
              )
            ) {
              continue;
            }
            const removalWeight =
              (1 - source.utility) * 6 +
              (1 - Math.min(1, (source.count || 0) / maxCount)) * 4 +
              (source.averageError - minAverageError) / errorRange;
            const detailWeight =
              source.detailProtection * 4 -
              target.detailProtection * 1.5;
            const mergeScore =
              metrics.score +
              removalWeight -
              detailWeight -
              target.utility * 2 -
              Math.min(2, ((target.count || 0) / maxCount) * 2);
            if (!bestMerge || mergeScore < bestMerge.score) {
              bestMerge = {
                sourceIndex: i,
                targetIndex: j,
                score: mergeScore,
                similarityScore: metrics.score,
              };
            }
          }
          if (i % 8 === 0) {
            await maybeYield();
          }
        }
      }
      if (!bestMerge) break;
      const source = working[bestMerge.sourceIndex];
      const target = working[bestMerge.targetIndex];
      const absorbedCount = source.count || 0;
      const absorbedError =
        (source.error || 0) + bestMerge.similarityScore * absorbedCount;
      target.count = (target.count || 0) + absorbedCount;
      target.error = (target.error || 0) + absorbedError;
      target.averageError = target.count ? target.error / target.count : target.error;
      target.members = target.members.concat(source.members || []);
      target.utility = utilityScore(target);
      if (typeof config.onMerge === "function") {
        await config.onMerge({
          source: source,
          target: target,
          completed: mergesCompleted + 1,
          total: mergesNeeded,
        });
      }
      working.splice(bestMerge.sourceIndex, 1);
      mergesCompleted += 1;
      await maybeYield();
    }
    const sorted = working
      .slice()
      .sort(function (a, b) {
        if (b.count !== a.count) return b.count - a.count;
        const utilityDiff = (b.utility || 0) - (a.utility || 0);
        if (Math.abs(utilityDiff) > 1e-6) return utilityDiff;
        return a.averageError - b.averageError;
      })
      .slice(0, maxPatterns);
    const representativeByKey = new Map();
    sorted.forEach(function (entry) {
      (entry.members || [entry.key]).forEach(function (memberKey) {
        representativeByKey.set(memberKey, entry.mask);
      });
      representativeByKey.set(entry.key, entry.mask);
    });
    return {
      charset: sorted.map(function (entry) {
        return entry.mask;
      }),
      representativeByKey: representativeByKey,
    };
  };
  const extractCellPixels = function (data, width, cellX, cellY, blockWidth, blockHeight) {
    const pixels = new Uint8Array(blockWidth * blockHeight * 3);
    for (let y = 0; y < blockHeight; y += 1) {
      for (let x = 0; x < blockWidth; x += 1) {
        const srcOffset = ((cellY + y) * width + (cellX + x)) * 4;
        const dstOffset = (y * blockWidth + x) * 3;
        pixels[dstOffset] = data[srcOffset];
        pixels[dstOffset + 1] = data[srcOffset + 1];
        pixels[dstOffset + 2] = data[srcOffset + 2];
      }
    }
    return pixels;
  };
  const cellPixelsCacheKey = function (pixels, blockWidth, blockHeight, paletteHash) {
    return (
      String(blockWidth || 0) +
      "x" +
      String(blockHeight || 0) +
      "|" +
      String(paletteHash || "") +
      "|" +
      hashNumbers(pixels, 2166136261).toString(16)
    );
  };
  const chooseGlobalBackgroundIndex = function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    const config = options || {};
    const cellSize = 8;
    const bgCandidates = Array.isArray(config.backgroundCandidates) &&
      config.backgroundCandidates.length
      ? config.backgroundCandidates
      : palette.map(function (_swatch, index) {
        return index;
      });
    const totals = new Float64Array(palette.length);
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        if (classifySolidPaletteCell(pixels, palette, config)) {
          continue;
        }
        const scored = paletteCellScores(pixels, palette);
        for (let i = 0; i < scored.length; i += 1) {
          totals[scored[i].index] += scored[i].total;
        }
      }
    }
    return strongestBackgroundIndex(totals, bgCandidates);
  };
  const chooseGlobalBackgroundIndexAsync = async function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    const config = options || {};
    const cellSize = 8;
    const bgCandidates = Array.isArray(config.backgroundCandidates) &&
      config.backgroundCandidates.length
      ? config.backgroundCandidates
      : palette.map(function (_swatch, index) {
        return index;
      });
    const maybeYield = makeUiYieldController(config.yieldBudgetMs);
    const totalCells = Math.ceil(height / cellSize) * Math.ceil(width / cellSize);
    const totals = new Float64Array(palette.length);
    const evaluatedCells = [];
    let currentWinner = bgCandidates[0] || 0;
    let processedCells = 0;
    if (config.previewData && palette[currentWinner]) {
      fillPreviewWithColor(config.previewData, palette[currentWinner]);
    }
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const specialCell = classifySolidPaletteCell(pixels, palette, config);
        if (specialCell) {
          const cellColor =
            palette[specialCell.colorIndex] || palette[currentWinner] || palette[0];
          evaluatedCells.push({
            x: cellX,
            y: cellY,
            width: blockWidth,
            height: blockHeight,
            color: cellColor,
          });
          if (config.previewData) {
            paintSolidCell(
              config.previewData,
              width,
              cellX,
              cellY,
              blockWidth,
              blockHeight,
              cellColor,
            );
          }
          processedCells += 1;
          reportProgress(config, {
            phase: "Background",
            completed: processedCells,
            total: totalCells,
            backgroundIndex: currentWinner,
            backgroundColor: palette[currentWinner] || palette[0] || [0, 0, 0],
            cellColor: cellColor,
            evaluatedCells: evaluatedCells.map(function (cell) {
              return {
                x: cell.x,
                y: cell.y,
                width: cell.width,
                height: cell.height,
                color: cell.color,
              };
            }),
            cellX: cellX,
            cellY: cellY,
            cellWidth: blockWidth,
            cellHeight: blockHeight,
          });
          if (processedCells % 4 === 0) await yieldToUi();
          await maybeYield();
          continue;
        }
        const scored = paletteCellScores(pixels, palette);
        const dominantCell = dominantPaletteCellColor(pixels, palette);
        const leanColor =
          palette[dominantCell.colorIndex] || palette[currentWinner] || palette[0];
        evaluatedCells.push({
          x: cellX,
          y: cellY,
          width: blockWidth,
          height: blockHeight,
          color: leanColor,
        });
        for (let i = 0; i < scored.length; i += 1) {
          totals[scored[i].index] += scored[i].total;
        }
        const nextWinner = strongestBackgroundIndex(totals, bgCandidates);
        const winnerChanged = nextWinner !== currentWinner;
        currentWinner = nextWinner;
        if (config.previewData) {
          if (winnerChanged) {
            fillPreviewWithColor(config.previewData, palette[currentWinner] || palette[0]);
            for (let i = 0; i < evaluatedCells.length; i += 1) {
              const cell = evaluatedCells[i];
              paintSolidCell(
                config.previewData,
                width,
                cell.x,
                cell.y,
                cell.width,
                cell.height,
                cell.color,
              );
            }
          } else {
            paintSolidCell(
              config.previewData,
              width,
              cellX,
              cellY,
              blockWidth,
              blockHeight,
              leanColor,
            );
          }
        }
        processedCells += 1;
        reportProgress(config, {
          phase: "Background",
          completed: processedCells,
          total: totalCells,
          backgroundIndex: currentWinner,
          backgroundColor: palette[currentWinner] || palette[0] || [0, 0, 0],
          cellColor: leanColor,
          evaluatedCells: evaluatedCells.map(function (cell) {
            return {
              x: cell.x,
              y: cell.y,
              width: cell.width,
              height: cell.height,
              color: cell.color,
            };
          }),
          cellX: cellX,
          cellY: cellY,
          cellWidth: blockWidth,
          cellHeight: blockHeight,
        });
        if (processedCells % 4 === 0) await yieldToUi();
        await maybeYield();
      }
    }
    return currentWinner;
  };
  const bestTwoColorCellFit = function (
    pixels,
    blockWidth,
    blockHeight,
    palette,
    candidates,
    options,
  ) {
    const config = options || {};
    const paletteHash = hashPalette(palette);
    const fitCacheKey =
      "fit|" +
      cellPixelsCacheKey(pixels, blockWidth, blockHeight, paletteHash) +
      "|bg:" +
      (config.backgroundIndex == null ? "*" : String(config.backgroundIndex));
    const cachedFit = getCachedC64Cell(fitCacheKey);
    if (cachedFit) return cachedFit;
    const cellPixels = blockWidth * blockHeight;
    let bestMask = new Uint8Array(64);
    let bestBg = palette[candidates[0]] || palette[0];
    let bestFg = bestBg;
    let bestError = Infinity;
    let bestBgErrors = new Float32Array(cellPixels);
    let bestFgErrors = new Float32Array(cellPixels);
    const backgroundIndexes = config.backgroundIndex == null
      ? candidates
      : [config.backgroundIndex];
    for (let bgIndex = 0; bgIndex < backgroundIndexes.length; bgIndex += 1) {
      for (let fgIndex = 0; fgIndex < candidates.length; fgIndex += 1) {
        const bg = palette[backgroundIndexes[bgIndex]] || palette[0];
        const fg = palette[candidates[fgIndex]];
        const bgErrors = new Float32Array(cellPixels);
        const fgErrors = new Float32Array(cellPixels);
        const mask = new Uint8Array(64);
        let totalError = 0;
        for (let y = 0; y < blockHeight; y += 1) {
          for (let x = 0; x < blockWidth; x += 1) {
            const pixelIndex = y * blockWidth + x;
            const offset = pixelIndex * 3;
            const drBg = pixels[offset] - bg[0];
            const dgBg = pixels[offset + 1] - bg[1];
            const dbBg = pixels[offset + 2] - bg[2];
            const drFg = pixels[offset] - fg[0];
            const dgFg = pixels[offset + 1] - fg[1];
            const dbFg = pixels[offset + 2] - fg[2];
            const bgError = drBg * drBg + dgBg * dgBg + dbBg * dbBg;
            const fgError = drFg * drFg + dgFg * dgFg + dbFg * dbFg;
            bgErrors[pixelIndex] = bgError;
            fgErrors[pixelIndex] = fgError;
            if (fgError < bgError) {
              mask[y * 8 + x] = 1;
              totalError += fgError;
            } else {
              totalError += bgError;
            }
          }
        }
        if (totalError < bestError) {
          bestError = totalError;
          bestMask = mask;
          bestBg = bg;
          bestFg = fg;
          bestBgErrors = bgErrors;
          bestFgErrors = fgErrors;
        }
      }
    }
    return setCachedC64Cell(fitCacheKey, {
      mask: bestMask,
      bg: bestBg,
      fg: bestFg,
      bgErrors: bestBgErrors,
      fgErrors: bestFgErrors,
      error: bestError,
    });
  };
  const scoreMaskAgainstCell = function (
    mask,
    blockWidth,
    blockHeight,
    bgErrors,
    fgErrors,
  ) {
    let totalError = 0;
    for (let y = 0; y < blockHeight; y += 1) {
      for (let x = 0; x < blockWidth; x += 1) {
        const pixelIndex = y * blockWidth + x;
        totalError += petsciiMaskBit(mask, x, y, blockWidth, blockHeight)
          ? fgErrors[pixelIndex]
          : bgErrors[pixelIndex];
      }
    }
    return totalError;
  };
  const paintMaskCell = function (
    data,
    width,
    cellX,
    cellY,
    blockWidth,
    blockHeight,
    mask,
    bg,
    fg,
  ) {
    for (let y = 0; y < blockHeight; y += 1) {
      for (let x = 0; x < blockWidth; x += 1) {
        const offset = ((cellY + y) * width + (cellX + x)) * 4;
        const swatch = petsciiMaskBit(mask, x, y, blockWidth, blockHeight)
          ? fg
          : bg;
        data[offset] = swatch[0];
        data[offset + 1] = swatch[1];
        data[offset + 2] = swatch[2];
      }
    }
  };
  const fillPreviewWithColor = function (data, color) {
    if (!data || !color) return;
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
    }
  };
  const paintSolidCell = function (
    data,
    width,
    cellX,
    cellY,
    blockWidth,
    blockHeight,
    color,
  ) {
    if (!data || !color) return;
    for (let y = 0; y < blockHeight; y += 1) {
      for (let x = 0; x < blockWidth; x += 1) {
        const offset = ((cellY + y) * width + (cellX + x)) * 4;
        data[offset] = color[0];
        data[offset + 1] = color[1];
        data[offset + 2] = color[2];
      }
    }
  };
  const strongestBackgroundIndex = function (totals, candidates) {
    const list = Array.isArray(candidates) && candidates.length
      ? candidates
      : totals.map(function (_value, index) {
        return index;
      });
    let bestIndex = list[0] || 0;
    let bestScore = Number.isFinite(totals[bestIndex]) ? totals[bestIndex] : Infinity;
    for (let i = 1; i < list.length; i += 1) {
      const index = list[i];
      const score = Number.isFinite(totals[index]) ? totals[index] : Infinity;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    return bestIndex;
  };
  const applyPalettePetscii = function (
    data,
    width,
    height,
    palette,
    glyphs,
    glyphCacheId,
  ) {
    const cellSize = 8;
    const colorLimit = Math.max(2, Math.min(6, palette.length));
    applyC64BayerPrepass(data, width, height, palette);
    const glyphCatalog =
      Array.isArray(glyphs) && glyphs.length ? glyphs : petsciiGlyphs;
    const paletteHash = hashPalette(palette);
    const glyphHash =
      fixedGlyphCatalogHashes[glyphCacheId] ||
      hashGlyphCatalog(glyphCatalog);
    const globalBackgroundIndex = chooseGlobalBackgroundIndex(
      data,
      width,
      height,
      palette,
      { colorLimit: colorLimit },
    );
    let processedCells = 0;
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const cellCacheKey =
          "glyph|" +
          String(glyphCacheId || "custom") +
          "|" +
          glyphHash +
          "|" +
          String(globalBackgroundIndex) +
          "|" +
          cellPixelsCacheKey(pixels, blockWidth, blockHeight, paletteHash);
        const cachedCell = getCachedC64Cell(cellCacheKey);
        if (cachedCell) {
          paintMaskCell(
            data,
            width,
            cellX,
            cellY,
            blockWidth,
            blockHeight,
            cachedCell.mask,
            cachedCell.bg,
            cachedCell.fg,
          );
          continue;
        }
        const candidates = paletteCellCandidates(pixels, palette, colorLimit);
        const fit = bestTwoColorCellFit(
          pixels,
          blockWidth,
          blockHeight,
          palette,
          candidates,
          { backgroundIndex: globalBackgroundIndex },
        );
        let bestGlyph = glyphCatalog[0];
        let bestError = Infinity;
        for (let glyphIndex = 0; glyphIndex < glyphCatalog.length; glyphIndex += 1) {
          const glyph = glyphCatalog[glyphIndex];
          const totalError = scoreMaskAgainstCell(
            glyph,
            blockWidth,
            blockHeight,
            fit.bgErrors,
            fit.fgErrors,
          );
          if (totalError < bestError) {
            bestError = totalError;
            bestGlyph = glyph;
          }
        }
        paintMaskCell(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
          bestGlyph,
          fit.bg,
          fit.fg,
        );
        setCachedC64Cell(cellCacheKey, {
          mask: bestGlyph,
          bg: fit.bg,
          fg: fit.fg,
        });
      }
    }
  };
  const applyPalettePetsciiAsync = async function (
    data,
    width,
    height,
    palette,
    glyphs,
    glyphCacheId,
    options,
  ) {
    const cellSize = 8;
    const colorLimit = Math.max(2, Math.min(6, palette.length));
    applyC64BayerPrepass(data, width, height, palette);
    const originalData = new Uint8ClampedArray(data);
    const glyphCatalog =
      Array.isArray(glyphs) && glyphs.length ? glyphs : petsciiGlyphs;
    const paletteHash = hashPalette(palette);
    const glyphHash =
      fixedGlyphCatalogHashes[glyphCacheId] ||
      hashGlyphCatalog(glyphCatalog);
    const config = options || {};
    const maybeYield = makeUiYieldController(config.yieldBudgetMs);
    const globalBackgroundIndex = await chooseGlobalBackgroundIndexAsync(
      data,
      width,
      height,
      palette,
      {
        colorLimit: colorLimit,
        previewData: data,
        onProgress: config.onProgress,
        progressIntervalMs: config.progressIntervalMs,
        yieldBudgetMs: config.yieldBudgetMs,
      },
    );
    const totalCells = Math.ceil(height / cellSize) * Math.ceil(width / cellSize);
    fillPreviewWithColor(data, palette[globalBackgroundIndex] || palette[0] || [0, 0, 0]);
    let processedCells = 0;
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          originalData,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const cellCacheKey =
          "glyph|" +
          String(glyphCacheId || "custom") +
          "|" +
          glyphHash +
          "|" +
          String(globalBackgroundIndex) +
          "|" +
          cellPixelsCacheKey(pixels, blockWidth, blockHeight, paletteHash);
        const cachedCell = getCachedC64Cell(cellCacheKey);
        if (cachedCell) {
          paintMaskCell(
            data,
            width,
            cellX,
            cellY,
            blockWidth,
            blockHeight,
            cachedCell.mask,
            cachedCell.bg,
            cachedCell.fg,
          );
        } else {
          const candidates = paletteCellCandidates(pixels, palette, colorLimit);
          const fit = bestTwoColorCellFit(
            pixels,
            blockWidth,
            blockHeight,
            palette,
            candidates,
            { backgroundIndex: globalBackgroundIndex },
          );
          let bestGlyph = glyphCatalog[0];
          let bestError = Infinity;
          for (let glyphIndex = 0; glyphIndex < glyphCatalog.length; glyphIndex += 1) {
            const glyph = glyphCatalog[glyphIndex];
            const totalError = scoreMaskAgainstCell(
              glyph,
              blockWidth,
              blockHeight,
              fit.bgErrors,
              fit.fgErrors,
            );
            if (totalError < bestError) {
              bestError = totalError;
              bestGlyph = glyph;
            }
          }
          paintMaskCell(
            data,
            width,
            cellX,
            cellY,
            blockWidth,
            blockHeight,
            bestGlyph,
            fit.bg,
            fit.fg,
          );
          setCachedC64Cell(cellCacheKey, {
            mask: bestGlyph,
            bg: fit.bg,
            fg: fit.fg,
          });
        }
        processedCells += 1;
        reportProgress(config, {
          phase: "Glyphs",
          completed: processedCells,
          total: totalCells,
          cellX: cellX,
          cellY: cellY,
          cellWidth: blockWidth,
          cellHeight: blockHeight,
        });
        if (processedCells % 4 === 0) await yieldToUi();
        await maybeYield();
      }
    }
  };
  const applyPaletteCustomCharset = function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    const cellSize = 8;
    const colorLimit = Math.max(2, Math.min(4, palette.length));
    applyC64BayerPrepass(data, width, height, palette);
    const config = options || {};
    const selectionBias = clampByte(
      config.selectionBias == null ? 128 : config.selectionBias,
    );
    const backgroundColor = palette[0] || [0, 0, 0];
    const globalBackgroundIndex = chooseGlobalBackgroundIndex(
      data,
      width,
      height,
      palette,
      {
        colorLimit: colorLimit,
        solidCellThreshold: config.solidCellThreshold,
      },
    );
    const finalBackground = palette[globalBackgroundIndex] || backgroundColor;
    const cellFits = [];
    const patternStats = new Map();
    let hasSpecialSolidForeground = false;
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const specialCell = classifySolidPaletteCell(pixels, palette, config);
        if (specialCell) {
          const solidColor = palette[specialCell.colorIndex] || finalBackground;
          const isForegroundSolid = specialCell.colorIndex !== globalBackgroundIndex;
          hasSpecialSolidForeground = hasSpecialSolidForeground || isForegroundSolid;
          cellFits.push({
            x: cellX,
            y: cellY,
            width: blockWidth,
            height: blockHeight,
            bg: finalBackground,
            fg: solidColor,
            specialSolid: true,
            solidColorIndex: specialCell.colorIndex,
          });
          continue;
        }
        const candidates = paletteCellCandidates(pixels, palette, colorLimit);
        const fit = bestTwoColorCellFit(
          pixels,
          blockWidth,
          blockHeight,
          palette,
          candidates,
          { backgroundIndex: globalBackgroundIndex },
        );
        const originalMask = fit.mask;
        const originalKey = maskKey(originalMask);
        const stat = patternStats.get(originalKey) || {
          key: originalKey,
          mask: originalMask,
          count: 0,
          error: 0,
        };
        stat.count += 1;
        stat.error += fit.error;
        patternStats.set(originalKey, stat);
        cellFits.push({
          x: cellX,
          y: cellY,
          width: blockWidth,
          height: blockHeight,
          bg: fit.bg,
          fg: fit.fg,
          bgErrors: fit.bgErrors,
          fgErrors: fit.fgErrors,
          originalMask: originalMask,
          originalKey: originalKey,
          mask: originalMask,
          key: originalKey,
        });
      }
    }
    const charset = selectVariedCharsetPatterns(
      Array.from(patternStats.values()),
      256,
      selectionBias,
    );
    const solidKey = maskKey(solidGlyphMask());
    if (hasSpecialSolidForeground) {
      const deduped = charset.filter(function (mask) {
        return maskKey(mask) !== solidKey;
      });
      deduped.unshift(solidGlyphMask());
      charset.splice(0, charset.length, ...deduped.slice(0, 256));
    } else if (!charset.length) {
      charset.push(new Uint8Array(64));
    }
    const charsetByKey = new Map(
      charset.map(function (mask) {
        return [maskKey(mask), mask];
      }),
    );
    cellFits.forEach(function (fit) {
      if (fit.specialSolid) {
        if (fit.solidColorIndex === globalBackgroundIndex) {
          paintSolidCell(
            data,
            width,
            fit.x,
            fit.y,
            fit.width,
            fit.height,
            fit.bg,
          );
        } else {
          paintMaskCell(
            data,
            width,
            fit.x,
            fit.y,
            fit.width,
            fit.height,
            charset[0] || solidGlyphMask(),
            fit.bg,
            fit.fg,
          );
        }
        return;
      }
      let bestMask =
        charsetByKey.get(fit.originalKey) ||
        charsetByKey.get(fit.key) ||
        charset[0] ||
        fit.mask;
      if (
        !charsetByKey.has(fit.originalKey) &&
        charset.length < 256
      ) {
        charset.push(fit.originalMask);
        charsetByKey.set(fit.originalKey, fit.originalMask);
        bestMask = fit.originalMask;
      } else if (!charsetByKey.has(fit.originalKey) && charset.length) {
        let bestError = Infinity;
        for (let i = 0; i < charset.length; i += 1) {
          const candidateMask = charset[i];
          const totalError = scoreMaskAgainstCell(
            candidateMask,
            fit.width,
            fit.height,
            fit.bgErrors,
            fit.fgErrors,
          );
          if (totalError < bestError) {
            bestError = totalError;
            bestMask = candidateMask;
          }
        }
      }
      paintMaskCell(
        data,
        width,
        fit.x,
        fit.y,
        fit.width,
        fit.height,
        bestMask,
        fit.bg,
        fit.fg,
      );
    });
    return charset;
  };
  const applyPaletteCustomCharsetAsync = async function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    const cellSize = 8;
    const colorLimit = Math.max(2, Math.min(4, palette.length));
    applyC64BayerPrepass(data, width, height, palette);
    const originalData = new Uint8ClampedArray(data);
    const config = options || {};
    const selectionBias = clampByte(
      config.selectionBias == null ? 128 : config.selectionBias,
    );
    const maybeYield = makeUiYieldController(config.yieldBudgetMs);
    const backgroundColor = palette[0] || [0, 0, 0];
    const globalBackgroundIndex = await chooseGlobalBackgroundIndexAsync(
      data,
      width,
      height,
      palette,
      {
        colorLimit: colorLimit,
        previewData: data,
        onProgress: config.onProgress,
        progressIntervalMs: config.progressIntervalMs,
        yieldBudgetMs: config.yieldBudgetMs,
        solidCellThreshold: config.solidCellThreshold,
      },
    );
    const totalCells = Math.ceil(height / cellSize) * Math.ceil(width / cellSize);
    const finalBackground = palette[globalBackgroundIndex] || backgroundColor;
    fillPreviewWithColor(data, finalBackground);
    const cellFits = [];
    const patternStats = new Map();
    const fitIndexesByKey = new Map();
    let hasSpecialSolidForeground = false;
    let processedCells = 0;
    for (let cellY = 0; cellY < height; cellY += cellSize) {
      for (let cellX = 0; cellX < width; cellX += cellSize) {
        const blockWidth = Math.min(cellSize, width - cellX);
        const blockHeight = Math.min(cellSize, height - cellY);
        const pixels = extractCellPixels(
          originalData,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
        );
        const specialCell = classifySolidPaletteCell(pixels, palette, config);
        if (specialCell) {
          const solidColor = palette[specialCell.colorIndex] || finalBackground;
          const isForegroundSolid = specialCell.colorIndex !== globalBackgroundIndex;
          hasSpecialSolidForeground = hasSpecialSolidForeground || isForegroundSolid;
          cellFits.push({
            x: cellX,
            y: cellY,
            width: blockWidth,
            height: blockHeight,
            bg: finalBackground,
            fg: solidColor,
            specialSolid: true,
            solidColorIndex: specialCell.colorIndex,
          });
          if (isForegroundSolid) {
            paintSolidCell(
              data,
              width,
              cellX,
              cellY,
              blockWidth,
              blockHeight,
              solidColor,
            );
          }
          processedCells += 1;
          reportProgress(config, {
            phase: "Analyze",
            completed: processedCells,
            total: totalCells,
            cellX: cellX,
            cellY: cellY,
            cellWidth: blockWidth,
            cellHeight: blockHeight,
          });
          if (processedCells % 4 === 0) await yieldToUi();
          await maybeYield();
          continue;
        }
        const candidates = paletteCellCandidates(pixels, palette, colorLimit);
        const fit = bestTwoColorCellFit(
          pixels,
          blockWidth,
          blockHeight,
          palette,
          candidates,
          { backgroundIndex: globalBackgroundIndex },
        );
        const originalMask = fit.mask;
        const originalKey = maskKey(originalMask);
        const stat = patternStats.get(originalKey) || {
          key: originalKey,
          mask: originalMask,
          count: 0,
          error: 0,
        };
        stat.count += 1;
        stat.error += fit.error;
        patternStats.set(originalKey, stat);
        cellFits.push({
          x: cellX,
          y: cellY,
          width: blockWidth,
          height: blockHeight,
          bg: fit.bg,
          fg: fit.fg,
          bgErrors: fit.bgErrors,
          fgErrors: fit.fgErrors,
          originalMask: originalMask,
          originalKey: originalKey,
          mask: originalMask,
          key: originalKey,
        });
        const fitIndex = cellFits.length - 1;
        const keyFits = fitIndexesByKey.get(originalKey) || [];
        keyFits.push(fitIndex);
        fitIndexesByKey.set(originalKey, keyFits);
        paintMaskCell(
          data,
          width,
          cellX,
          cellY,
          blockWidth,
          blockHeight,
          fit.mask,
          fit.bg,
          fit.fg,
        );
        processedCells += 1;
        reportProgress(config, {
          phase: "Analyze",
          completed: processedCells,
          total: totalCells,
          cellX: cellX,
          cellY: cellY,
          cellWidth: blockWidth,
          cellHeight: blockHeight,
        });
        if (processedCells % 4 === 0) await yieldToUi();
        await maybeYield();
      }
    }
    const selection = await selectVariedCharsetPatternsAsync(
      Array.from(patternStats.values()),
      256,
      selectionBias,
      {
        maybeYield: maybeYield,
        onMerge: async function (merge) {
          const memberKeys = merge && merge.source && Array.isArray(merge.source.members)
            ? merge.source.members
            : [merge.source && merge.source.key];
          let highlightFit = null;
          for (let memberIndex = 0; memberIndex < memberKeys.length; memberIndex += 1) {
            const memberKey = memberKeys[memberIndex];
            const indexes = fitIndexesByKey.get(memberKey) || [];
            for (let i = 0; i < indexes.length; i += 1) {
              const fit = cellFits[indexes[i]];
              if (!fit || fit.specialSolid) continue;
              fit.mask = merge.target.mask;
              fit.key = merge.target.key;
              paintMaskCell(
                data,
                width,
                fit.x,
                fit.y,
                fit.width,
                fit.height,
                merge.target.mask,
                fit.bg,
                fit.fg,
              );
              if (!highlightFit) highlightFit = fit;
            }
            await maybeYield();
          }
          reportProgress(config, {
            phase: "Reduce",
            completed: merge.completed,
            total: Math.max(1, merge.total || 1),
            cellX: highlightFit ? highlightFit.x : null,
            cellY: highlightFit ? highlightFit.y : null,
            cellWidth: highlightFit ? highlightFit.width : null,
            cellHeight: highlightFit ? highlightFit.height : null,
          });
          await maybeYield();
        },
      },
    );
    const charset = selection.charset;
    const representativeByKey = selection.representativeByKey || new Map();
    const solidKey = maskKey(solidGlyphMask());
    if (hasSpecialSolidForeground) {
      const deduped = charset.filter(function (mask) {
        return maskKey(mask) !== solidKey;
      });
      deduped.unshift(solidGlyphMask());
      charset.splice(0, charset.length, ...deduped.slice(0, 256));
    } else if (!charset.length) {
      charset.push(new Uint8Array(64));
    }
    const charsetByKey = new Map(
      charset.map(function (mask) {
        return [maskKey(mask), mask];
      }),
    );
    for (let index = 0; index < cellFits.length; index += 1) {
      const fit = cellFits[index];
      if (fit.specialSolid) {
        if (fit.solidColorIndex === globalBackgroundIndex) {
          paintSolidCell(
            data,
            width,
            fit.x,
            fit.y,
            fit.width,
            fit.height,
            fit.bg,
          );
        } else {
          paintMaskCell(
            data,
            width,
            fit.x,
            fit.y,
            fit.width,
            fit.height,
            charset[0] || solidGlyphMask(),
            fit.bg,
            fit.fg,
          );
        }
        reportProgress(config, {
          phase: "Paint",
          completed: index + 1,
          total: cellFits.length,
          cellX: fit.x,
          cellY: fit.y,
          cellWidth: fit.width,
          cellHeight: fit.height,
        });
        if ((index + 1) % 4 === 0) await yieldToUi();
        await maybeYield();
        continue;
      }
      let bestMask =
        representativeByKey.get(fit.originalKey) ||
        charsetByKey.get(fit.key) ||
        charsetByKey.get(fit.originalKey) ||
        null;
      if (!bestMask && charset.length) {
        let bestError = Infinity;
        for (let i = 0; i < charset.length; i += 1) {
          const candidateMask = charset[i];
          const totalError = scoreMaskAgainstCell(
            candidateMask,
            fit.width,
            fit.height,
            fit.bgErrors,
            fit.fgErrors,
          );
          if (totalError < bestError) {
            bestError = totalError;
            bestMask = candidateMask;
          }
        }
      }
      if (!bestMask) {
        bestMask = fit.mask || fit.originalMask || charset[0] || solidGlyphMask();
      }
      paintMaskCell(
        data,
        width,
        fit.x,
        fit.y,
        fit.width,
        fit.height,
        bestMask,
        fit.bg,
        fit.fg,
      );
      reportProgress(config, {
        phase: "Paint",
        completed: index + 1,
        total: cellFits.length,
        cellX: fit.x,
        cellY: fit.y,
        cellWidth: fit.width,
        cellHeight: fit.height,
      });
      if ((index + 1) % 4 === 0) await yieldToUi();
      await maybeYield();
    }
    return charset;
  };
  TPP.buildImageExportCustomCharsetSheet = function (canvas, palette, options) {
    if (!canvas || !canvas.width || !canvas.height) return null;
    const paletteColors =
      Array.isArray(palette) && palette.length ? palette : [[0, 0, 0]];
    const sourceCtx = canvas.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) return null;
    const image = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = new Uint8ClampedArray(image.data);
    const config = options || {};
    const charset = applyPaletteCustomCharset(
      data,
      canvas.width,
      canvas.height,
      paletteColors,
      config,
    );
    const patterns = Array.isArray(charset) ? charset : [];
    const cellSize = Math.max(8, Number(config.cellSize) || 8);
    const cols = 16;
    const rows = 16;
    const padding = Math.max(0, Number(config.padding) || 0);
    const gutter = Math.max(0, Number(config.gutter) || 0);
    const checkerboardPreview = Boolean(config.checkerboardPreview);
    const out = document.createElement("canvas");
    out.width =
      cols * cellSize + padding * 2 + Math.max(0, cols - 1) * gutter;
    out.height =
      rows * cellSize + padding * 2 + Math.max(0, rows - 1) * gutter;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = config.background || "#f8f2e6";
    ctx.fillRect(0, 0, out.width, out.height);
    patterns.forEach(function (mask, index) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x0 = padding + col * (cellSize + gutter);
      const y0 = padding + row * (cellSize + gutter);
      const darkCell = (row + col) % 2 === 1;
      const bgColor = checkerboardPreview
        ? darkCell
          ? "#d0d0d0"
          : "#ffffff"
        : "#ffffff";
      const fgColor = checkerboardPreview
        ? darkCell
          ? "#404040"
          : "#000000"
        : "#000000";
      ctx.fillStyle = bgColor;
      ctx.fillRect(x0, y0, cellSize, cellSize);
      const px = cellSize / 8;
      ctx.fillStyle = fgColor;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          if (!mask[y * 8 + x]) continue;
          ctx.fillRect(
            x0 + x * px,
            y0 + y * px,
            Math.max(1, Math.ceil(px)),
            Math.max(1, Math.ceil(px)),
          );
        }
      }
    });
    return {
      canvas: out,
      count: patterns.length,
      patterns: patterns,
    };
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
    "c64-petscii": function (data, width, height, palette) {
      applyPalettePetscii(
        data,
        width,
        height,
        palette,
        petsciiGlyphs,
        "blocks",
      );
    },
    "c64-petscii-full": function (data, width, height, palette) {
      applyPalettePetscii(
        data,
        width,
        height,
        palette,
        petsciiFullGlyphs,
        "full",
      );
    },
    "c64-custom-charset": function (data, width, height, palette, options) {
      applyPaletteCustomCharset(data, width, height, palette, options);
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
    apply(data, width, height, palette, config);
  };
  TPP.applyImageExportPaletteDitherAsync = async function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    if (!Array.isArray(palette) || !palette.length) return;
    const config = options || {};
    const algorithm = String(config.algorithm || "threshold");
    if (algorithm === "c64-custom-charset") {
      await applyPaletteCustomCharsetAsync(data, width, height, palette, config);
      return;
    }
    if (algorithm === "c64-petscii") {
      await applyPalettePetsciiAsync(
        data,
        width,
        height,
        palette,
        petsciiGlyphs,
        "blocks",
        config,
      );
      return;
    }
    if (algorithm === "c64-petscii-full") {
      await applyPalettePetsciiAsync(
        data,
        width,
        height,
        palette,
        petsciiFullGlyphs,
        "full",
        config,
      );
      return;
    }
    TPP.applyImageExportPaletteDither(data, width, height, palette, config);
  };

  return {
    applyMonoDither: TPP.applyImageExportMonoDither,
    applyPaletteDither: TPP.applyImageExportPaletteDither,
    applyPaletteDitherAsync: TPP.applyImageExportPaletteDitherAsync,
    buildCustomCharsetSheet: TPP.buildImageExportCustomCharsetSheet,
    buildImageExportSeqScreen: TPP.buildImageExportSeqScreen,
  };
}
