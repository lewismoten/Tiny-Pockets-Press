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
  const colorDepth = ["color24", "gray8", "mono1", "websafe"].includes(
    source.colorDepth,
  )
    ? source.colorDepth
    : "color24";
  return {
    dpi: TPP.dpi(source.dpi),
    format:
      colorDepth === "websafe" && !["png", "gif"].includes(requestedFormat)
        ? "png"
        : requestedFormat,
    quality: Math.max(1, Math.min(100, Number(source.quality) || 92)),
    colorDepth: colorDepth,
    threshold: Math.max(0, Math.min(255, Number(source.threshold) || 128)),
  };
};
TPP.exportCanvasForDepth = function (canvas, colorDepth, threshold) {
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
    } else if (colorDepth === "websafe") {
      data[i] = Math.max(0, Math.min(255, Math.round(data[i] / 51) * 51));
      data[i + 1] = Math.max(
        0,
        Math.min(255, Math.round(data[i + 1] / 51) * 51),
      );
      data[i + 2] = Math.max(
        0,
        Math.min(255, Math.round(data[i + 2] / 51) * 51),
      );
    } else {
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
  }
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
TPP.gifWorkerScript =
  "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js";
TPP.gifQualityValue = function (quality) {
  const pct = Math.max(1, Math.min(100, Number(quality) || 92));
  return Math.max(1, Math.min(30, Math.round(31 - pct * 0.3)));
};
TPP.encodeGifBlob = function (canvas, quality) {
  if (!canvas) return Promise.reject(new Error("Canvas required"));
  if (typeof window.GIF !== "function")
    return Promise.reject(new Error("GIF encoder unavailable"));
  return new Promise(function (resolve, reject) {
    try {
      const gif = new window.GIF({
        workers: 2,
        quality: TPP.gifQualityValue(quality),
        workerScript: TPP.gifWorkerScript,
        width: canvas.width,
        height: canvas.height,
      });
      gif.on("finished", resolve);
      gif.on("abort", function () {
        reject(new Error("GIF encoding aborted"));
      });
      gif.on("error", function (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
      gif.addFrame(canvas, { copy: true, delay: 250 });
      gif.render();
    } catch (error) {
      reject(error);
    }
  });
};
TPP.exportBlobForCanvas = function (canvas, options) {
  if (!canvas) return Promise.resolve(null);
  const exportOptions = TPP.imageExportOptions(options);
  if (exportOptions.format === "gif")
    return TPP.encodeGifBlob(canvas, exportOptions.quality);
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
  if (exportOptions.format === "gif" && typeof window.GIF !== "function") {
    alert("GIF export encoder failed to load.");
    return;
  }
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
