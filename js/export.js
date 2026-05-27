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
TPP.gifPaletteSize = function (quality) {
  const pct = Math.max(1, Math.min(100, Number(quality) || 92));
  return Math.max(16, Math.min(256, Math.round(16 + (pct / 100) * 240)));
};
TPP.encodeGifBlob = async function (canvas) {
  if (!canvas) throw new Error("Canvas required");
  const lib = await TPP.loadGifEncoder();
  const readCanvas = document.createElement("canvas");
  readCanvas.width = canvas.width;
  readCanvas.height = canvas.height;
  const readCtx = readCanvas.getContext("2d", { willReadFrequently: true });
  readCtx.drawImage(canvas, 0, 0);
  const image = readCtx.getImageData(0, 0, canvas.width, canvas.height);
  const rgba = image.data;
  const palette = lib.quantize(rgba, 256);
  const index = lib.applyPalette(rgba, palette);
  const gif = lib.GIFEncoder();
  gif.writeFrame(index, canvas.width, canvas.height, {
    palette: palette,
    delay: 250,
  });
  gif.finish();
  const bytes = gif.bytesView ? gif.bytesView() : new Uint8Array(gif.bytes());
  return new Blob([bytes], { type: "image/gif" });
};
TPP.exportBlobForCanvas = function (canvas, options) {
  if (!canvas) return Promise.resolve(null);
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.format === "gif") return TPP.encodeGifBlob(canvas);
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
