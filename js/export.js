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
        : TPP.imageExportPaletteIds().includes(source.palette)
          ? String(source.palette)
          : "websafe",
  };
};
TPP.IMAGE_EXPORT_PALETTE_SCHEMA_VERSION = 1;
TPP.IMAGE_EXPORT_PALETTE_ITEM_SCHEMA_VERSION = 1;
TPP.IMAGE_EXPORT_PALETTE_CATALOG = "/data/palettes.catalog.v1.json";
TPP.imageExportPaletteById = TPP.imageExportPaletteById || {};
TPP.imageExportPaletteIdsCached = TPP.imageExportPaletteIdsCached || [];
TPP.imageExportPaletteCatalogById = TPP.imageExportPaletteCatalogById || {};
TPP.imageExportPaletteLoadPromise = null;
TPP.imageExportPaletteIdsDefault = [
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
];
TPP.fallbackWebsafePalette = function () {
  const websafe = [];
  [0, 51, 102, 153, 204, 255].forEach(function (r) {
    [0, 51, 102, 153, 204, 255].forEach(function (g) {
      [0, 51, 102, 153, 204, 255].forEach(function (b) {
        websafe.push([r, g, b]);
      });
    });
  });
  return websafe;
};
TPP.hexToRgbSwatch = function (value) {
  const hex = String(value || "").trim();
  const match = /^#?([a-fA-F0-9]{6})$/.exec(hex);
  if (!match) return null;
  const full = match[1];
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};
TPP.imageExportPaletteIds = function () {
  if (TPP.imageExportPaletteIdsCached.length)
    return TPP.imageExportPaletteIdsCached.slice();
  return TPP.imageExportPaletteIdsDefault.slice();
};
TPP.loadImageExportPalettes = async function () {
  const response = await fetch(TPP.IMAGE_EXPORT_PALETTE_CATALOG, {
    cache: "no-cache",
  });
  if (!response.ok)
    throw new Error("Palette catalog load failed: " + response.status);
  const payload = await response.json();
  if (
    !payload ||
    Number(payload.schemaVersion) !== TPP.IMAGE_EXPORT_PALETTE_SCHEMA_VERSION ||
    !Array.isArray(payload.palettes)
  )
    throw new Error("Palette catalog schema mismatch");
  const catalogMap = {};
  const ids = [];
  payload.palettes.forEach(function (entry) {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof entry.file !== "string"
    )
      return;
    const id = entry.id.trim();
    if (!id) return;
    catalogMap[id] = {
      id: id,
      name: typeof entry.name === "string" ? entry.name : id,
      file: entry.file,
    };
    ids.push(id);
  });
  const uniqueIds = Array.from(new Set(ids));
  const map = {};
  const loadPalette = async function (id) {
    const meta = catalogMap[id];
    if (!meta || !meta.file) return;
    const fileResponse = await fetch(meta.file, { cache: "no-cache" });
    if (!fileResponse.ok)
      throw new Error("Palette file load failed: " + id + " " + fileResponse.status);
    const palettePayload = await fileResponse.json();
    if (
      !palettePayload ||
      Number(palettePayload.schemaVersion) !==
        TPP.IMAGE_EXPORT_PALETTE_ITEM_SCHEMA_VERSION ||
      palettePayload.id !== id ||
      !Array.isArray(palettePayload.colors)
    )
      throw new Error("Palette file schema mismatch: " + id);
    const colors = palettePayload.colors
      .map(TPP.hexToRgbSwatch)
      .filter(Boolean);
    if (!colors.length) throw new Error("Palette file has no colors: " + id);
    map[id] = colors;
  };
  await Promise.all(uniqueIds.map(loadPalette));
  if (!map.websafe) map.websafe = TPP.fallbackWebsafePalette();
  if (!ids.includes("websafe")) ids.unshift("websafe");
  TPP.imageExportPaletteById = map;
  TPP.imageExportPaletteCatalogById = catalogMap;
  TPP.imageExportPaletteIdsCached = uniqueIds.includes("websafe")
    ? uniqueIds
    : ["websafe"].concat(uniqueIds);
  return map;
};
TPP.ensureImageExportPalettesLoaded = async function () {
  if (TPP.imageExportPaletteIdsCached.length) return;
  if (!TPP.imageExportPaletteLoadPromise) {
    TPP.imageExportPaletteLoadPromise = TPP.loadImageExportPalettes()
      .catch(function (_error) {
        TPP.imageExportPaletteById = {
          websafe: TPP.fallbackWebsafePalette(),
        };
        TPP.imageExportPaletteIdsCached = ["websafe"];
      })
      .finally(function () {
        TPP.imageExportPaletteLoadPromise = null;
      });
  }
  await TPP.imageExportPaletteLoadPromise;
};
TPP.imageExportNamedPalette = function (name) {
  const id = String(name || "websafe");
  if (TPP.imageExportPaletteById[id]) return TPP.imageExportPaletteById[id];
  if (TPP.imageExportPaletteById.websafe)
    return TPP.imageExportPaletteById.websafe;
  return TPP.fallbackWebsafePalette();
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
  await TPP.ensureImageExportPalettesLoaded();
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
  await TPP.ensureImageExportPalettesLoaded();
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
  await TPP.ensureImageExportPalettesLoaded();
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
