window.TPP = window.TPP || {};

TPP.waitForImages = async function (root) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (resolve) {
        const done = function () {
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    }),
  );
};

TPP.exportPdfFrom = async function (which) {
  TPP.switchView(which);
  if (which === "interior") TPP.renderInterior();
  else TPP.renderCover();

  const settings = TPP.settings();
  const container =
    which === "interior"
      ? document.getElementById("interiorPreview")
      : document.getElementById("coverPreview");
  const pdf = new jspdf.jsPDF({
    orientation:
      settings.sheet.h >= settings.sheet.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.sheet.w, settings.sheet.h],
    compress: true,
  });
  const sheets = Array.from(container.querySelectorAll("[data-pdf-page]"));
  for (let i = 0; i < sheets.length; i++) {
    TPP.showProgress(
      5 + Math.round((i / sheets.length) * 90),
      "Rendering " +
        which +
        " PDF page " +
        (i + 1) +
        " of " +
        sheets.length +
        "…",
    );
    const el = sheets[i];
    const oldTransform = el.style.transform;
    const oldMargin = el.style.marginBottom;
    el.style.transform = "none";
    el.style.marginBottom = "0";
    TPP.renderQr(el, settings);
    await TPP.waitForImages(el);
    await new Promise(requestAnimationFrame);
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#fff" });
    if (i) pdf.addPage([settings.sheet.w, settings.sheet.h]);
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      settings.sheet.w,
      settings.sheet.h,
    );
    el.style.transform = oldTransform;
    el.style.marginBottom = oldMargin;
    await new Promise(requestAnimationFrame);
  }
  const name =
    (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-") +
    "-" +
    which +
    ".pdf";
  pdf.save(name);
  TPP.showProgress(100, "PDF complete");
};
TPP.exportReadablePdf = async function () {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const pdf = new jspdf.jsPDF({
    orientation: settings.page.h >= settings.page.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.page.w, settings.page.h],
    compress: true,
  });
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 90),
        "Rendering eBook PDF page " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      const pageEl = TPP.pageEl(page, settings, 0, 0, false, true);
      shell.appendChild(pageEl);
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(shell, {
        scale: 3,
        backgroundColor: "#fff",
      });
      if (i) pdf.addPage([settings.page.w, settings.page.h]);
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        settings.page.w,
        settings.page.h,
      );
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
  } finally {
    mount.remove();
  }
  const name =
    (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-") +
    "-ebook.pdf";
  pdf.save(name);
  TPP.showProgress(100, "eBook PDF complete");
};
TPP.imageExportOptions = function (options) {
  const source = options || {};
  const requestedFormat = ["png", "gif", "jpeg", "webp"].includes(source.format)
    ? source.format
    : "png";
  const requestedDepth = [
    "color24",
    "gray8",
    "mono1",
    "indexed",
    "websafe",
  ].includes(source.colorDepth)
    ? source.colorDepth
    : "color24";
  const colorDepth = requestedDepth === "websafe" ? "indexed" : requestedDepth;
  return {
    dpi: TPP.dpi(source.dpi),
    format:
      colorDepth === "indexed" && !["png", "gif"].includes(requestedFormat)
        ? "png"
        : requestedFormat,
    quality: Math.max(1, Math.min(100, Number(source.quality) || 92)),
    colorDepth: colorDepth,
    threshold: Math.max(0, Math.min(255, Number(source.threshold) || 128)),
    frameDelay: Math.max(
      1000,
      Math.min(10000, Number(source.frameDelay) || 1000),
    ),
    palette:
      requestedDepth === "websafe"
        ? "websafe"
        : [
              "websafe",
              "colors4",
              "colors8",
              "colors16",
              "colors32",
              "colors64",
              "colors128",
              "colors256",
              "gray4",
              "gray8",
              "gray16",
              "gray32",
              "gray64",
              "gray128",
              "gray256",
              "windows16",
              "ansi16",
              "xterm256",
              "ega16",
              "atari400base",
              "atari400",
              "cga0",
              "cga1",
            ].includes(source.palette)
          ? source.palette
          : "websafe",
  };
};
TPP.imageExportPaletteFromLevels = function (levelsR, levelsG, levelsB) {
  const palette = [];
  const values = function (levels) {
    if (levels <= 1) return [0];
    const out = [];
    for (let i = 0; i < levels; i++)
      out.push(Math.round((255 * i) / (levels - 1)));
    return out;
  };
  const reds = values(levelsR);
  const greens = values(levelsG);
  const blues = values(levelsB);
  reds.forEach(function (r) {
    greens.forEach(function (g) {
      blues.forEach(function (b) {
        palette.push([r, g, b]);
      });
    });
  });
  return palette;
};
TPP.imageExportSizedPalette = function (count) {
  let dims = [1, 1, 1];
  const product = function () {
    return dims[0] * dims[1] * dims[2];
  };
  while (product() < count) {
    let index = 0;
    for (let i = 1; i < dims.length; i++) {
      if (dims[i] < dims[index]) index = i;
    }
    dims[index] += 1;
    if (product() > count) break;
  }
  while (product() > count) {
    let index = 0;
    for (let i = 1; i < dims.length; i++) {
      if (dims[i] > dims[index]) index = i;
    }
    if (dims[index] > 1) dims[index] -= 1;
    else break;
  }
  return TPP.imageExportPaletteFromLevels(dims[0], dims[1], dims[2]).slice(
    0,
    count,
  );
};
TPP.imageExportGrayscalePalette = function (count) {
  const palette = [];
  const total = Math.max(2, Number(count) || 2);
  for (let i = 0; i < total; i++) {
    const gray = Math.round((255 * i) / (total - 1));
    palette.push([gray, gray, gray]);
  }
  return palette;
};
TPP.imageExportNamedPalette = function (name) {
  const ansi16 = [
    [0, 0, 0],
    [205, 0, 0],
    [0, 205, 0],
    [205, 205, 0],
    [0, 0, 238],
    [205, 0, 205],
    [0, 205, 205],
    [229, 229, 229],
    [127, 127, 127],
    [255, 0, 0],
    [0, 255, 0],
    [255, 255, 0],
    [92, 92, 255],
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 255],
  ];
  const windows16 = [
    [0, 0, 0],
    [128, 0, 0],
    [0, 128, 0],
    [128, 128, 0],
    [0, 0, 128],
    [128, 0, 128],
    [0, 128, 128],
    [192, 192, 192],
    [128, 128, 128],
    [255, 0, 0],
    [0, 255, 0],
    [255, 255, 0],
    [0, 0, 255],
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 255],
  ];
  const ega16 = [
    [0, 0, 0],
    [0, 0, 170],
    [0, 170, 0],
    [0, 170, 170],
    [170, 0, 0],
    [170, 0, 170],
    [170, 85, 0],
    [170, 170, 170],
    [85, 85, 85],
    [85, 85, 255],
    [85, 255, 85],
    [85, 255, 255],
    [255, 85, 85],
    [255, 85, 255],
    [255, 255, 85],
    [255, 255, 255],
  ];
  const atari400Artifact = [
    [0, 0, 0],
    [17, 17, 17],
    [34, 34, 34],
    [51, 51, 51],
    [68, 68, 68],
    [85, 85, 85],
    [102, 102, 102],
    [119, 119, 119],
    [136, 136, 136],
    [153, 153, 153],
    [170, 170, 170],
    [187, 187, 187],
    [204, 204, 204],
    [221, 221, 221],
    [238, 238, 238],
    [255, 255, 255],
    [25, 7, 0],
    [42, 24, 0],
    [59, 41, 0],
    [76, 58, 0],
    [93, 75, 0],
    [110, 92, 0],
    [127, 109, 0],
    [144, 126, 9],
    [161, 143, 26],
    [179, 160, 43],
    [195, 177, 60],
    [212, 194, 77],
    [229, 211, 94],
    [247, 228, 111],
    [255, 245, 130],
    [255, 255, 150],
    [49, 0, 0],
    [63, 0, 0],
    [83, 23, 0],
    [100, 40, 0],
    [117, 57, 0],
    [134, 74, 0],
    [151, 91, 10],
    [168, 108, 27],
    [185, 125, 44],
    [202, 142, 61],
    [219, 159, 78],
    [236, 176, 95],
    [253, 193, 112],
    [255, 210, 133],
    [255, 227, 156],
    [255, 244, 178],
    [66, 4, 4],
    [79, 0, 0],
    [96, 8, 0],
    [113, 25, 0],
    [130, 42, 13],
    [147, 59, 30],
    [164, 76, 47],
    [181, 93, 64],
    [198, 110, 81],
    [215, 127, 98],
    [232, 144, 115],
    [249, 161, 131],
    [255, 178, 152],
    [255, 195, 174],
    [255, 212, 196],
    [255, 229, 218],
    [65, 1, 3],
    [80, 0, 15],
    [97, 0, 27],
    [114, 15, 43],
    [131, 32, 60],
    [148, 49, 77],
    [165, 66, 94],
    [182, 83, 111],
    [199, 100, 128],
    [216, 117, 145],
    [233, 134, 162],
    [250, 151, 179],
    [255, 168, 200],
    [255, 185, 222],
    [255, 202, 239],
    [251, 220, 246],
    [51, 0, 53],
    [68, 0, 65],
    [85, 0, 76],
    [102, 12, 92],
    [119, 29, 109],
    [136, 46, 126],
    [153, 63, 143],
    [170, 80, 160],
    [187, 97, 177],
    [204, 114, 194],
    [221, 131, 211],
    [238, 148, 228],
    [255, 165, 228],
    [255, 182, 233],
    [255, 199, 238],
    [255, 216, 243],
    [29, 0, 92],
    [46, 0, 104],
    [64, 0, 116],
    [81, 16, 132],
    [98, 33, 149],
    [115, 50, 166],
    [132, 67, 183],
    [149, 84, 200],
    [166, 101, 217],
    [183, 118, 234],
    [200, 135, 235],
    [217, 152, 235],
    [233, 169, 236],
    [251, 186, 235],
    [255, 203, 239],
    [255, 223, 249],
    [2, 0, 113],
    [19, 0, 125],
    [36, 11, 140],
    [53, 28, 157],
    [70, 45, 174],
    [87, 62, 191],
    [104, 79, 208],
    [121, 96, 225],
    [138, 113, 242],
    [155, 130, 247],
    [172, 147, 247],
    [189, 164, 247],
    [206, 181, 247],
    [223, 198, 247],
    [240, 215, 247],
    [255, 232, 248],
    [0, 0, 104],
    [0, 10, 124],
    [8, 27, 144],
    [25, 44, 161],
    [42, 61, 178],
    [59, 78, 195],
    [76, 95, 212],
    [93, 112, 229],
    [110, 129, 246],
    [127, 146, 255],
    [144, 163, 255],
    [161, 180, 255],
    [178, 197, 255],
    [195, 214, 255],
    [212, 231, 255],
    [229, 248, 255],
    [0, 10, 77],
    [0, 27, 99],
    [0, 44, 121],
    [2, 61, 143],
    [19, 78, 160],
    [36, 95, 177],
    [53, 112, 194],
    [70, 129, 211],
    [87, 146, 228],
    [104, 163, 245],
    [121, 180, 255],
    [138, 197, 255],
    [155, 214, 255],
    [172, 231, 255],
    [189, 248, 255],
    [206, 255, 255],
    [0, 26, 38],
    [0, 43, 60],
    [0, 60, 82],
    [0, 77, 104],
    [6, 94, 124],
    [23, 111, 141],
    [40, 128, 158],
    [57, 145, 175],
    [74, 162, 192],
    [91, 179, 209],
    [108, 196, 226],
    [125, 213, 243],
    [142, 230, 255],
    [159, 247, 255],
    [176, 255, 255],
    [193, 255, 255],
    [1, 37, 10],
    [2, 54, 16],
    [0, 70, 34],
    [0, 87, 56],
    [5, 104, 77],
    [22, 121, 94],
    [39, 138, 111],
    [56, 155, 128],
    [73, 172, 145],
    [90, 189, 162],
    [107, 206, 179],
    [124, 223, 196],
    [141, 240, 213],
    [158, 255, 229],
    [175, 255, 241],
    [192, 255, 253],
    [4, 38, 13],
    [4, 56, 17],
    [5, 71, 19],
    [0, 90, 27],
    [16, 107, 27],
    [33, 124, 44],
    [50, 141, 61],
    [67, 158, 78],
    [84, 175, 95],
    [101, 192, 112],
    [118, 209, 129],
    [135, 226, 146],
    [152, 243, 163],
    [169, 255, 179],
    [186, 255, 191],
    [203, 255, 203],
    [0, 35, 10],
    [0, 53, 16],
    [4, 70, 19],
    [21, 86, 19],
    [38, 103, 19],
    [55, 120, 19],
    [72, 137, 20],
    [89, 154, 37],
    [106, 171, 54],
    [123, 188, 71],
    [140, 205, 88],
    [157, 222, 105],
    [174, 239, 122],
    [191, 255, 139],
    [208, 255, 151],
    [225, 255, 163],
    [0, 23, 7],
    [14, 40, 8],
    [31, 57, 8],
    [48, 74, 8],
    [65, 91, 8],
    [82, 108, 8],
    [99, 125, 8],
    [116, 142, 13],
    [133, 159, 30],
    [150, 176, 47],
    [167, 193, 64],
    [184, 210, 81],
    [201, 227, 98],
    [218, 244, 115],
    [235, 255, 130],
    [252, 255, 142],
    [27, 7, 1],
    [44, 24, 1],
    [60, 41, 0],
    [77, 59, 0],
    [95, 76, 0],
    [112, 94, 0],
    [129, 111, 0],
    [147, 128, 9],
    [164, 146, 26],
    [178, 160, 43],
    [199, 180, 61],
    [216, 198, 78],
    [234, 215, 96],
    [246, 228, 111],
    [255, 250, 132],
    [255, 255, 153],
  ];
  const atari400 = [];
  for (let i = 0; i < atari400Artifact.length; i += 16) {
    const row = atari400Artifact.slice(i, i + 16);
    for (let luminance = 0; luminance < row.length; luminance += 2)
      atari400.push(row[luminance]);
  }
  const websafe = [];
  [0, 51, 102, 153, 204, 255].forEach(function (r) {
    [0, 51, 102, 153, 204, 255].forEach(function (g) {
      [0, 51, 102, 153, 204, 255].forEach(function (b) {
        websafe.push([r, g, b]);
      });
    });
  });
  if (name === "websafe") return websafe;
  if (name === "windows16") return windows16;
  if (name === "ansi16") return ansi16;
  if (name === "ega16") return ega16;
  if (name === "atari400base") return atari400;
  if (name === "atari400") return atari400Artifact;
  if (name === "cga0")
    return [
      [0, 0, 0],
      [85, 255, 255],
      [255, 85, 255],
      [255, 255, 255],
    ];
  if (name === "cga1")
    return [
      [0, 0, 0],
      [85, 255, 85],
      [255, 85, 85],
      [170, 85, 0],
    ];
  if (name === "xterm256") {
    const palette = ansi16.slice();
    [0, 95, 135, 175, 215, 255].forEach(function (r) {
      [0, 95, 135, 175, 215, 255].forEach(function (g) {
        [0, 95, 135, 175, 215, 255].forEach(function (b) {
          palette.push([r, g, b]);
        });
      });
    });
    for (let i = 0; i < 24; i++) {
      const gray = 8 + i * 10;
      palette.push([gray, gray, gray]);
    }
    return palette.slice(0, 256);
  }
  const countMap = {
    colors4: 4,
    colors8: 8,
    colors16: 16,
    colors32: 32,
    colors64: 64,
    colors128: 128,
    colors256: 256,
  };
  const grayCountMap = {
    gray4: 4,
    gray8: 8,
    gray16: 16,
    gray32: 32,
    gray64: 64,
    gray128: 128,
    gray256: 256,
  };
  if (grayCountMap[name])
    return TPP.imageExportGrayscalePalette(grayCountMap[name]);
  return TPP.imageExportSizedPalette(countMap[name] || 256);
};
TPP.applyIndexedPalette = function (data, palette) {
  const cache = new Map();
  const nearest = function (r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    if (cache.has(key)) return cache.get(key);
    let best = palette[0] || [0, 0, 0];
    let bestDist = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const swatch = palette[i];
      const dr = r - swatch[0];
      const dg = g - swatch[1];
      const db = b - swatch[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = swatch;
        if (dist === 0) break;
      }
    }
    cache.set(key, best);
    return best;
  };
  for (let i = 0; i < data.length; i += 4) {
    const match = nearest(data[i], data[i + 1], data[i + 2]);
    data[i] = match[0];
    data[i + 1] = match[1];
    data[i + 2] = match[2];
  }
};
TPP.canvasRgba = function (canvas) {
  const readCanvas = document.createElement("canvas");
  readCanvas.width = canvas.width;
  readCanvas.height = canvas.height;
  const readCtx = readCanvas.getContext("2d", { willReadFrequently: true });
  readCtx.drawImage(canvas, 0, 0);
  return readCtx.getImageData(0, 0, canvas.width, canvas.height).data;
};
TPP.gifPaletteForExport = function (rgba, exportOptions, lib, transparent) {
  const reserve = transparent ? 1 : 0;
  if (exportOptions.colorDepth === "mono1")
    return TPP.imageExportGrayscalePalette(2);
  if (exportOptions.colorDepth === "gray8")
    return TPP.imageExportGrayscalePalette(256 - reserve);
  if (exportOptions.colorDepth === "indexed")
    return TPP.imageExportNamedPalette(exportOptions.palette).slice(
      0,
      Math.max(1, 256 - reserve),
    );
  return lib.quantize(rgba, Math.max(2, 256 - reserve));
};
TPP.gifFrameFromRgba = function (
  rgba,
  width,
  height,
  exportOptions,
  lib,
  previousRgba,
) {
  const transparent = Boolean(previousRgba);
  const basePalette = TPP.gifPaletteForExport(
    rgba,
    exportOptions,
    lib,
    transparent,
  );
  const baseIndex = lib.applyPalette(rgba, basePalette);
  if (!transparent) {
    return {
      index: baseIndex,
      palette: basePalette,
      transparent: false,
      dispose: 0,
    };
  }
  const index = new Uint8Array(baseIndex.length);
  let changed = 0;
  for (let i = 0, p = 0; i < rgba.length; i += 4, p += 1) {
    const same =
      rgba[i] === previousRgba[i] &&
      rgba[i + 1] === previousRgba[i + 1] &&
      rgba[i + 2] === previousRgba[i + 2] &&
      rgba[i + 3] === previousRgba[i + 3];
    if (same) {
      index[p] = 0;
    } else {
      index[p] = baseIndex[p] + 1;
      changed += 1;
    }
  }
  if (!changed) index[0] = 1;
  return {
    index: index,
    palette: [[0, 0, 0]].concat(basePalette),
    transparent: true,
    transparentIndex: 0,
    dispose: 1,
  };
};
TPP.exportCanvasForDepth = function (
  canvas,
  colorDepth,
  threshold,
  paletteName,
) {
  if (!canvas || colorDepth === "color24") return canvas;
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  const image = ctx.getImageData(0, 0, out.width, out.height);
  const data = image.data;
  const monoThreshold = Math.max(0, Math.min(255, Number(threshold) || 128));
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114,
    );
    if (colorDepth === "mono1") {
      const bit = gray >= monoThreshold ? 255 : 0;
      data[i] = bit;
      data[i + 1] = bit;
      data[i + 2] = bit;
    } else if (colorDepth === "gray8") {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }
  if (colorDepth === "indexed")
    TPP.applyIndexedPalette(data, TPP.imageExportNamedPalette(paletteName));
  ctx.putImageData(image, 0, 0);
  return out;
};
TPP.renderImageExportPreviewCanvas = async function (page, settings, scale) {
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const shell = document.createElement("div");
    shell.style.position = "relative";
    shell.style.width = settings.page.w + "in";
    shell.style.height = settings.page.h + "in";
    shell.style.background = "#fff";
    shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    mount.appendChild(shell);
    TPP.renderQr(shell, settings);
    await TPP.waitForImages(shell);
    await new Promise(requestAnimationFrame);
    return await html2canvas(shell, {
      scale: Math.max(1, Number(scale) || 1),
      backgroundColor: "#fff",
    });
  } finally {
    mount.remove();
  }
};
TPP.previewDataUrl = function (canvas, format, quality) {
  const mime =
    format === "jpeg"
      ? "image/jpeg"
      : format === "webp"
        ? "image/webp"
        : "image/png";
  return canvas.toDataURL(
    mime,
    format === "png" ? undefined : Math.max(0.01, Math.min(1, quality || 0.92)),
  );
};
TPP.gifEncoderLib = null;
TPP.gifEncoderPromise = null;
TPP.mp4MuxerLib = null;
TPP.mp4MuxerPromise = null;
TPP.loadGifEncoder = function () {
  if (TPP.gifEncoderLib) return Promise.resolve(TPP.gifEncoderLib);
  if (!TPP.gifEncoderPromise) {
    TPP.gifEncoderPromise = import("https://unpkg.com/gifenc")
      .then(function (lib) {
        TPP.gifEncoderLib = lib;
        return lib;
      })
      .catch(function (error) {
        TPP.gifEncoderPromise = null;
        throw error;
      });
  }
  return TPP.gifEncoderPromise;
};
TPP.loadMp4Muxer = function () {
  if (TPP.mp4MuxerLib) return Promise.resolve(TPP.mp4MuxerLib);
  if (!TPP.mp4MuxerPromise) {
    TPP.mp4MuxerPromise = import("https://unpkg.com/mp4-muxer?module")
      .then(function (lib) {
        TPP.mp4MuxerLib = lib;
        return lib;
      })
      .catch(function (error) {
        TPP.mp4MuxerPromise = null;
        throw error;
      });
  }
  return TPP.mp4MuxerPromise;
};
TPP.supportedMp4Codec = async function (width, height, bitrate) {
  if (typeof window.VideoEncoder !== "function") return null;
  const codecs = ["avc1.42001f", "avc1.42E01E", "avc1.640028"];
  for (let i = 0; i < codecs.length; i++) {
    try {
      const config = {
        codec: codecs[i],
        width: width,
        height: height,
        bitrate: bitrate,
        framerate: 30,
        avc: { format: "avc" },
      };
      const support = await window.VideoEncoder.isConfigSupported(config);
      if (support && support.supported) return config;
    } catch (_error) {}
  }
  return null;
};
TPP.mp4Bitrate = function (width, height, quality) {
  const pixels =
    Math.max(1, Number(width) || 1) * Math.max(1, Number(height) || 1);
  const q = Math.max(1, Math.min(100, Number(quality) || 92)) / 100;
  return Math.round(Math.max(600000, pixels * 1.2 * (0.45 + q * 1.55)));
};
TPP.opaqueCanvas = function (canvas, background) {
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext("2d");
  ctx.fillStyle = background || "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
};
TPP.encodeGifBlob = async function (canvas, options) {
  if (!canvas) throw new Error("Canvas required");
  const lib = await TPP.loadGifEncoder();
  const exportOptions = TPP.imageExportOptions(options);
  const rgba = TPP.canvasRgba(canvas);
  const frame = TPP.gifFrameFromRgba(
    rgba,
    canvas.width,
    canvas.height,
    exportOptions,
    lib,
    null,
  );
  const gif = lib.GIFEncoder();
  gif.writeFrame(frame.index, canvas.width, canvas.height, {
    palette: frame.palette,
    delay: exportOptions.frameDelay,
  });
  gif.finish();
  const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
  return new Blob([bytes], { type: "image/gif" });
};
TPP.exportBlobForCanvas = function (canvas, options) {
  if (!canvas) return Promise.resolve(null);
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.format === "gif")
    return TPP.encodeGifBlob(canvas, exportOptions);
  const mime =
    exportOptions.format === "jpeg"
      ? "image/jpeg"
      : exportOptions.format === "webp"
        ? "image/webp"
        : "image/png";
  return new Promise(function (resolve) {
    canvas.toBlob(
      function (blob) {
        resolve(blob || null);
      },
      mime,
      exportOptions.format === "png"
        ? undefined
        : Math.max(0.01, Math.min(1, exportOptions.quality / 100 || 0.92)),
    );
  });
};
TPP.previewBlobSize = function (canvas, format, quality) {
  return TPP.exportBlobForCanvas(canvas, {
    format: format,
    quality: quality,
  }).then(function (blob) {
    return blob ? blob.size : 0;
  });
};
TPP.exportImagesZip = async function (options) {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!window.JSZip) {
    alert("ZIP export library failed to load.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(options);
  const zip = new JSZip();
  const mount = document.createElement("div");
  const targetDpi = exportOptions.dpi;
  const scale = targetDpi / 96;
  const extension =
    exportOptions.format === "jpeg" ? "jpg" : exportOptions.format;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering page image " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(shell, {
        scale: scale,
        backgroundColor: "#fff",
      });
      const exportCanvas = TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
      );
      const blob = await TPP.exportBlobForCanvas(exportCanvas, exportOptions);
      const pageName =
        "page-" + String(i + 1).padStart(4, "0") + "." + extension;
      zip.file(pageName, blob);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    TPP.showProgress(90, "Building ZIP archive...");
    const blob = await zip.generateAsync({ type: "blob" }, function (meta) {
      TPP.showProgress(
        90 + Math.round(meta.percent * 0.1),
        "Building ZIP archive...",
      );
    });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") +
      "-pages-" +
      targetDpi +
      "dpi-" +
      exportOptions.format +
      ".zip";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "Page images ZIP complete");
};
TPP.exportAnimatedGif = async function (options) {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!pages.length) {
    alert("No pages available to export.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(
    Object.assign({}, options || {}, { format: "gif" }),
  );
  const lib = await TPP.loadGifEncoder();
  const gif = lib.GIFEncoder();
  const mount = document.createElement("div");
  const scale = exportOptions.dpi / 96;
  let previousRgba = null;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering GIF frame " + (i + 1) + " of " + pages.length + "...",
      );
      const page = pages[i];
      const shell = document.createElement("div");
      shell.style.position = "relative";
      shell.style.width = settings.page.w + "in";
      shell.style.height = settings.page.h + "in";
      shell.style.background = "#fff";
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
      mount.appendChild(shell);
      TPP.renderQr(shell, settings);
      await TPP.waitForImages(shell);
      await new Promise(requestAnimationFrame);
      const canvas = await html2canvas(shell, {
        scale: scale,
        backgroundColor: "#fff",
      });
      const exportCanvas = TPP.exportCanvasForDepth(
        canvas,
        exportOptions.colorDepth,
        exportOptions.threshold,
        exportOptions.palette,
      );
      const rgba = TPP.canvasRgba(exportCanvas);
      const frame = TPP.gifFrameFromRgba(
        rgba,
        exportCanvas.width,
        exportCanvas.height,
        exportOptions,
        lib,
        previousRgba,
      );
      gif.writeFrame(frame.index, exportCanvas.width, exportCanvas.height, {
        palette: frame.palette,
        delay: exportOptions.frameDelay,
        repeat: i === 0 ? 0 : undefined,
        transparent: frame.transparent || undefined,
        transparentIndex: frame.transparent
          ? frame.transparentIndex
          : undefined,
        dispose: frame.transparent ? frame.dispose : undefined,
      });
      previousRgba = new Uint8ClampedArray(rgba);
      shell.remove();
      await new Promise(requestAnimationFrame);
    }
    gif.finish();
    const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
    const blob = new Blob([bytes], { type: "image/gif" });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") + "-pages-animated.gif";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "Animated GIF complete");
};
TPP.exportMp4 = async function (options) {
  TPP.sync();
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  if (!pages.length) {
    alert("No pages available to export.");
    return;
  }
  if (typeof window.VideoEncoder !== "function") {
    alert("MP4 export is not supported in this browser.");
    return;
  }
  const exportOptions = TPP.imageExportOptions(options);
  const muxerLib = await TPP.loadMp4Muxer();
  const mount = document.createElement("div");
  const scale = exportOptions.dpi / 96;
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;pointer-events:none;";
  document.body.appendChild(mount);
  try {
    const probeShell = document.createElement("div");
    probeShell.style.position = "relative";
    probeShell.style.width = settings.page.w + "in";
    probeShell.style.height = settings.page.h + "in";
    probeShell.style.background = "#fff";
    probeShell.appendChild(TPP.pageEl(pages[0], settings, 0, 0, false, true));
    mount.appendChild(probeShell);
    TPP.renderQr(probeShell, settings);
    await TPP.waitForImages(probeShell);
    await new Promise(requestAnimationFrame);
    const probeCanvas = await html2canvas(probeShell, {
      scale: scale,
      backgroundColor: "#fff",
    });
    const firstCanvas = TPP.exportCanvasForDepth(
      probeCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
    );
    const firstOpaqueCanvas = TPP.opaqueCanvas(firstCanvas, "#ffffff");
    const width = firstOpaqueCanvas.width;
    const height = firstOpaqueCanvas.height;
    const bitrate = TPP.mp4Bitrate(width, height, exportOptions.quality);
    const config = await TPP.supportedMp4Codec(width, height, bitrate);
    if (!config) {
      throw new Error("No supported MP4 codec found in this browser.");
    }
    const target = new muxerLib.ArrayBufferTarget();
    const muxer = new muxerLib.Muxer({
      target: target,
      fastStart: "in-memory",
      video: {
        codec: "avc",
        width: width,
        height: height,
      },
    });
    const encoder = new window.VideoEncoder({
      output: function (chunk, meta) {
        muxer.addVideoChunk(chunk, meta);
      },
      error: function (error) {
        throw error;
      },
    });
    encoder.configure(config);
    let timestamp = 0;
    const duration = exportOptions.frameDelay * 1000;
    for (let i = 0; i < pages.length; i++) {
      TPP.showProgress(
        5 + Math.round((i / pages.length) * 80),
        "Rendering MP4 frame " + (i + 1) + " of " + pages.length + "...",
      );
      const pageCanvas =
        i === 0
          ? firstOpaqueCanvas
          : await (async function () {
              const shell = document.createElement("div");
              shell.style.position = "relative";
              shell.style.width = settings.page.w + "in";
              shell.style.height = settings.page.h + "in";
              shell.style.background = "#fff";
              shell.appendChild(
                TPP.pageEl(pages[i], settings, 0, 0, false, true),
              );
              mount.appendChild(shell);
              TPP.renderQr(shell, settings);
              await TPP.waitForImages(shell);
              await new Promise(requestAnimationFrame);
              const canvas = await html2canvas(shell, {
                scale: scale,
                backgroundColor: "#fff",
              });
              shell.remove();
              return TPP.opaqueCanvas(
                TPP.exportCanvasForDepth(
                  canvas,
                  exportOptions.colorDepth,
                  exportOptions.threshold,
                  exportOptions.palette,
                ),
                "#ffffff",
              );
            })();
      const frame = new VideoFrame(pageCanvas, {
        timestamp: timestamp,
        duration: duration,
      });
      encoder.encode(frame, { keyFrame: i === 0 });
      frame.close();
      timestamp += duration;
      await new Promise(requestAnimationFrame);
    }
    await encoder.flush();
    encoder.close();
    muxer.finalize();
    const blob = new Blob([target.buffer], { type: "video/mp4" });
    const name =
      (settings.title || "tiny-book")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") + "-pages.mp4";
    TPP.downloadBlob(name, blob);
  } finally {
    mount.remove();
  }
  TPP.showProgress(100, "MP4 complete");
};
