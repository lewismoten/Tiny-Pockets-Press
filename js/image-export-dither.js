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
  const paletteCellCandidates = function (pixels, palette, limit) {
    const scored = palette.map(function (swatch, index) {
      let total = 0;
      for (let i = 0; i < pixels.length; i += 3) {
        const dr = pixels[i] - swatch[0];
        const dg = pixels[i + 1] - swatch[1];
        const db = pixels[i + 2] - swatch[2];
        total += dr * dr + dg * dg + db * db;
      }
      return { index: index, total: total };
    });
    scored.sort(function (a, b) {
      return a.total - b.total;
    });
    return scored
      .slice(0, Math.max(1, Math.min(Number(limit) || 1, scored.length)))
      .map(function (entry) {
        return entry.index;
      });
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
    const normalizedBias = clampByte(bias == null ? 128 : bias) / 255;
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
    const enriched = entries.map(function (entry) {
      return {
        key: entry.key,
        mask: entry.mask,
        count: entry.count,
        error: entry.error,
        averageError: entry.count ? entry.error / entry.count : entry.error,
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
      return countScore * 0.7 + errorScore * 0.3;
    };
    const utilitySorted = enriched.slice().sort(function (a, b) {
      const utilityDiff = utilityScore(b) - utilityScore(a);
      if (Math.abs(utilityDiff) > 1e-6) return utilityDiff;
      if (b.count !== a.count) return b.count - a.count;
      return a.averageError - b.averageError;
    });
    const selected = [];
    const used = new Set();
    const accuracyQuota = Math.max(
      0,
      Math.min(maxPatterns, Math.round(normalizedBias * maxPatterns)),
    );
    const varietyQuota = Math.max(0, maxPatterns - accuracyQuota);
    while (selected.length < accuracyQuota && selected.length < maxPatterns) {
      const nextAccuracy = utilitySorted.find(function (entry) {
        return !used.has(entry.key);
      });
      if (!nextAccuracy) break;
      selected.push(nextAccuracy);
      used.add(nextAccuracy.key);
    }
    if (!selected.length && utilitySorted.length) {
      selected.push(utilitySorted[0]);
      used.add(utilitySorted[0].key);
    }
    while (
      selected.length < accuracyQuota + varietyQuota &&
      selected.length < maxPatterns
    ) {
      let bestCandidate = null;
      let bestScore = -Infinity;
      for (let i = 0; i < enriched.length; i += 1) {
        const candidate = enriched[i];
        if (used.has(candidate.key)) continue;
        let nearestDistance = Infinity;
        for (let j = 0; j < selected.length; j += 1) {
          nearestDistance = Math.min(
            nearestDistance,
            maskHammingDistance(candidate.mask, selected[j].mask),
          );
        }
        const varietyScore = nearestDistance / 64;
        const score = varietyScore * 0.85 + utilityScore(candidate) * 0.15;
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }
      if (!bestCandidate) break;
      selected.push(bestCandidate);
      used.add(bestCandidate.key);
    }
    if (selected.length < maxPatterns) {
      const remaining = utilitySorted
        .filter(function (entry) {
          return !used.has(entry.key);
        });
      for (let i = 0; i < remaining.length && selected.length < maxPatterns; i += 1) {
        selected.push(remaining[i]);
        used.add(remaining[i].key);
      }
    }
    return selected.map(function (entry) {
      return entry.mask;
    });
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
    const colorLimit = Math.max(
      2,
      Math.min(Number(config.colorLimit) || 6, palette.length),
    );
    const bgCandidates = Array.isArray(config.backgroundCandidates) &&
      config.backgroundCandidates.length
      ? config.backgroundCandidates
      : palette.map(function (_swatch, index) {
        return index;
      });
    let bestBgIndex = bgCandidates[0] || 0;
    let bestError = Infinity;
    for (let candidateIndex = 0; candidateIndex < bgCandidates.length; candidateIndex += 1) {
      const bgIndex = bgCandidates[candidateIndex];
      let totalError = 0;
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
          const candidates = paletteCellCandidates(pixels, palette, colorLimit);
          const fit = bestTwoColorCellFit(
            pixels,
            blockWidth,
            blockHeight,
            palette,
            candidates,
            { backgroundIndex: bgIndex },
          );
          totalError += fit.error;
        }
      }
      if (totalError < bestError) {
        bestError = totalError;
        bestBgIndex = bgIndex;
      }
    }
    return bestBgIndex;
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
  const applyPaletteCustomCharset = function (
    data,
    width,
    height,
    palette,
    options,
  ) {
    const cellSize = 8;
    const colorLimit = Math.max(2, Math.min(4, palette.length));
    const config = options || {};
    const selectionBias = clampByte(
      config.selectionBias == null ? 128 : config.selectionBias,
    );
    const globalBackgroundIndex = chooseGlobalBackgroundIndex(
      data,
      width,
      height,
      palette,
      { colorLimit: colorLimit },
    );
    const cellFits = [];
    const patternStats = new Map();
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
    const charsetByKey = new Map(
      charset.map(function (mask) {
        return [maskKey(mask), mask];
      }),
    );
    cellFits.forEach(function (fit) {
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

  return {
    applyMonoDither: TPP.applyImageExportMonoDither,
    applyPaletteDither: TPP.applyImageExportPaletteDither,
    buildCustomCharsetSheet: TPP.buildImageExportCustomCharsetSheet,
    buildImageExportSeqScreen: TPP.buildImageExportSeqScreen,
  };
}
