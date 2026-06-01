let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;
  if (typeof TPP.ensureControlModule === "function") {
    await TPP.ensureControlModule("image-export-palette-dialog");
  }
  const imageExportDialog = document.getElementById("imageExportDialog");
  const imageExportPreset = document.getElementById("imageExportDialogPreset");
  const imageExportDpi = document.getElementById("imageExportDialogDpi");
  const imageExportCustomWrap = document.getElementById(
    "imageExportDialogCustomWrap",
  );
  const imageExportFormat = document.getElementById("imageExportDialogFormat");
  const imageExportColorDepth = document.getElementById(
    "imageExportDialogColorDepth",
  );
  const imageExportQualityWrap = document.getElementById(
    "imageExportDialogQualityWrap",
  );
  const imageExportQuality = document.getElementById(
    "imageExportDialogQuality",
  );
  const imageExportQualityValue = document.getElementById(
    "imageExportDialogQualityValue",
  );
  const imageExportPaletteWrap = document.getElementById(
    "imageExportDialogPaletteWrap",
  );
  const imageExportPalette = document.getElementById(
    "imageExportDialogPalette",
  );
  const imageExportPalettePreview = document.getElementById(
    "imageExportPalettePreview",
  );
  const imageExportPalettePreviewCanvas = document.getElementById(
    "imageExportPalettePreviewCanvas",
  );
  const imageExportPaletteDialog = document.getElementById(
    "imageExportPaletteDialog",
  );
  const imageExportPaletteDialogTitle = document.getElementById(
    "imageExportPaletteDialogTitle",
  );
  const imageExportPaletteDialogCanvas = document.getElementById(
    "imageExportPaletteDialogCanvas",
  );
  const imageExportPaletteSample = document.getElementById(
    "imageExportPaletteSample",
  );
  const imageExportPaletteHex = document.getElementById(
    "imageExportPaletteHex",
  );
  const imageExportPaletteRgb = document.getElementById(
    "imageExportPaletteRgb",
  );
  const imageExportPaletteHsv = document.getElementById(
    "imageExportPaletteHsv",
  );
  const imageExportPaletteLch = document.getElementById(
    "imageExportPaletteLch",
  );
  const imageExportThresholdWrap = document.getElementById(
    "imageExportDialogThresholdWrap",
  );
  const imageExportThreshold = document.getElementById(
    "imageExportDialogThreshold",
  );
  const imageExportThresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  const imageExportEstimate = document.getElementById(
    "imageExportDialogEstimate",
  );
  const imageExportPreviewPrev = document.getElementById(
    "imageExportPreviewPrev",
  );
  const imageExportPreviewNext = document.getElementById(
    "imageExportPreviewNext",
  );
  const imageExportDownloadBefore = document.getElementById(
    "imageExportDownloadBefore",
  );
  const imageExportDownloadAfter = document.getElementById(
    "imageExportDownloadAfter",
  );
  const imageExportPreviewDuration = document.getElementById(
    "imageExportPreviewDuration",
  );
  const imageExportPreviewPlay = document.getElementById(
    "imageExportPreviewPlay",
  );
  const imageExportFrameDelay = document.getElementById(
    "imageExportFrameDelay",
  );
  const imageExportAnimatedGif = imageExportDialog
    ? imageExportDialog.querySelector("[data-action='export-animated-gif']")
    : null;
  const imageExportMp4 = imageExportDialog
    ? imageExportDialog.querySelector("[data-action='export-mp4']")
    : null;
  if (
    !imageExportDialog ||
    !imageExportPreset ||
    !imageExportDpi ||
    !imageExportCustomWrap ||
    !imageExportFormat ||
    !imageExportColorDepth ||
    !imageExportQualityWrap ||
    !imageExportQuality ||
    !imageExportQualityValue ||
    !imageExportPaletteWrap ||
    !imageExportPalette ||
    !imageExportPalettePreview ||
    !imageExportPalettePreviewCanvas ||
    !imageExportPaletteDialog ||
    !imageExportPaletteDialogTitle ||
    !imageExportPaletteDialogCanvas ||
    !imageExportPaletteSample ||
    !imageExportPaletteHex ||
    !imageExportPaletteRgb ||
    !imageExportPaletteHsv ||
    !imageExportPaletteLch ||
    !imageExportThresholdWrap ||
    !imageExportThreshold ||
    !imageExportThresholdValue ||
    !imageExportEstimate ||
    !imageExportPreviewPrev ||
    !imageExportPreviewNext ||
    !imageExportDownloadBefore ||
    !imageExportDownloadAfter ||
    !imageExportPreviewDuration ||
    !imageExportPreviewPlay ||
    !imageExportFrameDelay ||
    !imageExportAnimatedGif ||
    !imageExportMp4
  ) {
    return {};
  }
  const presetValues = ["72", "96", "150", "200", "300", "600"];
  const saveImageExportUi = function (patch) {
    const previous = TPP.imageExportUi();
    const dpiValue = TPP.dpi(Number(imageExportDpi.value) || 300);
    const presetValue = imageExportPreset.value || "300";
    const nextPatch = Object.assign({}, patch || {});
    if (!Object.prototype.hasOwnProperty.call(nextPatch, "customDpi")) {
      nextPatch.customDpi =
        presetValue === "custom"
          ? dpiValue
          : TPP.dpi(previous.customDpi || previous.dpi || 300);
    }
    TPP.writeImageExportUi(
      Object.assign(
        {
          dpiPreset: presetValue,
          customDpi: nextPatch.customDpi,
          dpi: dpiValue,
          format: imageExportFormat.value || "png",
          quality: Math.max(
            1,
            Math.min(100, Number(imageExportQuality.value) || 92),
          ),
          colorDepth: imageExportColorDepth.value || "color24",
          palette: imageExportPalette.value || "websafe",
          threshold: Math.max(
            0,
            Math.min(255, Number(imageExportThreshold.value) || 128),
          ),
          frameDelay: TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
        },
        nextPatch,
      ),
    );
  };
  const paletteGrid = function (count) {
    const total = Math.max(1, Number(count) || 1);
    const exact = {
      1: [1, 1],
      2: [2, 1],
      4: [2, 2],
      8: [4, 2],
      16: [4, 4],
      32: [8, 4],
      64: [8, 8],
      128: [16, 8],
      256: [16, 16],
    };
    if (exact[total]) return { cols: exact[total][0], rows: exact[total][1] };
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    return { cols: cols, rows: Math.max(1, Math.ceil(total / cols)) };
  };
  const paletteHex = function (swatch) {
    return (
      "#" +
      swatch
        .map(function (value) {
          return Math.max(0, Math.min(255, Number(value) || 0))
            .toString(16)
            .padStart(2, "0");
        })
        .join("")
    );
  };
  const paletteHsv = function (swatch) {
    const r = swatch[0] / 255;
    const g = swatch[1] / 255;
    const b = swatch[2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    h = Math.round((h * 60 + 360) % 360);
    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;
    return "hsv(" + h + ", " + s.toFixed(1) + "%, " + v.toFixed(1) + "%)";
  };
  const paletteLch = function (swatch) {
    const srgb = swatch.map(function (value) {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const x = srgb[0] * 0.4124564 + srgb[1] * 0.3575761 + srgb[2] * 0.1804375;
    const y = srgb[0] * 0.2126729 + srgb[1] * 0.7151522 + srgb[2] * 0.072175;
    const z = srgb[0] * 0.0193339 + srgb[1] * 0.119192 + srgb[2] * 0.9503041;
    const xr = x / 0.95047;
    const yr = y / 1;
    const zr = z / 1.08883;
    const f = function (value) {
      return value > 0.008856 ? Math.cbrt(value) : (903.3 * value + 16) / 116;
    };
    const fx = f(xr);
    const fy = f(yr);
    const fz = f(zr);
    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    const c = Math.sqrt(a * a + b * b);
    const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
    return (
      "lch(" + l.toFixed(2) + "% " + c.toFixed(2) + " " + h.toFixed(2) + ")"
    );
  };
  const paletteGridLayout = function (paletteName, options) {
    const palette = TPP.imageExportNamedPalette(paletteName || "websafe");
    const grid = paletteGrid(palette.length || 1);
    return {
      palette: palette,
      grid: grid,
      options: Object.assign(
        {
          gap: 0,
          border: false,
          padding: 0,
        },
        options || {},
      ),
    };
  };
  const paletteSelectionInfo = function (layout, canvas, clientX, clientY) {
    if (!layout || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const padding = layout.options.padding;
    const gap = layout.options.gap;
    const innerWidth = Math.max(1, canvas.width - padding * 2);
    const innerHeight = Math.max(1, canvas.height - padding * 2);
    const cellWidth = innerWidth / layout.grid.cols;
    const cellHeight = innerHeight / layout.grid.rows;
    const relX = x - padding;
    const relY = y - padding;
    if (relX < 0 || relY < 0 || relX > innerWidth || relY > innerHeight)
      return null;
    const col = Math.floor(relX / cellWidth);
    const row = Math.floor(relY / cellHeight);
    const cellX = col * cellWidth + gap / 2;
    const cellY = row * cellHeight + gap / 2;
    const cellW = Math.max(1, cellWidth - gap);
    const cellH = Math.max(1, cellHeight - gap);
    if (
      relX < cellX ||
      relY < cellY ||
      relX > cellX + cellW ||
      relY > cellY + cellH
    )
      return null;
    const index = row * layout.grid.cols + col;
    if (index < 0 || index >= layout.palette.length) return null;
    return index;
  };
  const updatePaletteInspector = function (swatch) {
    if (!swatch) return;
    imageExportPaletteSample.style.background =
      "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
    imageExportPaletteHex.value = paletteHex(swatch);
    imageExportPaletteRgb.value =
      "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
    imageExportPaletteHsv.value = paletteHsv(swatch);
    imageExportPaletteLch.value = paletteLch(swatch);
  };
  const drawPalettePreview = function (canvas, paletteName, options) {
    if (!canvas || !TPP.imageExportNamedPalette) return;
    const layout = paletteGridLayout(paletteName, options);
    const palette = layout.palette;
    const width = Number(canvas.width) || 16;
    const height = Number(canvas.height) || 16;
    const cols = layout.grid.cols;
    const rows = layout.grid.rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const opts = layout.options;
    const gap = Math.max(0, Number(opts.gap) || 0);
    const padding = Math.max(0, Number(opts.padding) || 0);
    const innerWidth = Math.max(1, width - padding * 2);
    const innerHeight = Math.max(1, height - padding * 2);
    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / rows;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f8f2e6";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < palette.length; i++) {
      const swatch = palette[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * cellWidth + gap / 2;
      const y = padding + row * cellHeight + gap / 2;
      const w = Math.max(1, cellWidth - gap);
      const h = Math.max(1, cellHeight - gap);
      ctx.fillStyle =
        "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
      ctx.fillRect(x, y, w, h);
      if (opts.border) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          x + 0.5,
          y + 0.5,
          Math.max(0, w - 1),
          Math.max(0, h - 1),
        );
      }
      if (Number(opts.selectedIndex) === i) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, Math.max(0, w - 8), Math.max(0, h - 8));
      }
    }
  };
  const openPalettePreview = async function () {
    if (typeof imageExportPaletteDialog.showModal !== "function") return;
    await ensureSelectedPalette();
    const paletteName = imageExportPalette.value || "websafe";
    const layout = paletteGridLayout(paletteName, {
      gap: 6,
      border: true,
      padding: 8,
      selectedIndex: Math.max(
        0,
        Number(TPP.imageExportPaletteSelectedIndex) || 0,
      ),
    });
    const palette = layout.palette;
    const grid = layout.grid;
    TPP.imageExportPaletteSelectedIndex = Math.min(
      Math.max(0, Number(TPP.imageExportPaletteSelectedIndex) || 0),
      Math.max(0, palette.length - 1),
    );
    layout.options.selectedIndex = TPP.imageExportPaletteSelectedIndex;
    const cellSize = Math.max(28, Math.min(64, Math.floor(640 / grid.cols)));
    imageExportPaletteDialogCanvas.width = grid.cols * cellSize + 16;
    imageExportPaletteDialogCanvas.height = grid.rows * cellSize + 16;
    TPP.imageExportPaletteDialogLayout = layout;
    drawPalettePreview(
      imageExportPaletteDialogCanvas,
      paletteName,
      layout.options,
    );
    imageExportPaletteDialogTitle.textContent =
      (imageExportPalette.selectedOptions[0]
        ? imageExportPalette.selectedOptions[0].textContent
        : "Palette") + " Preview";
    updatePaletteInspector(
      palette[TPP.imageExportPaletteSelectedIndex] || palette[0],
    );
    if (!imageExportPaletteDialog.open) imageExportPaletteDialog.showModal();
  };
  const syncPalettePreview = function () {
    drawPalettePreview(
      imageExportPalettePreviewCanvas,
      imageExportPalette.value || "websafe",
      { gap: 0, border: false, padding: 0 },
    );
    imageExportPalettePreview.disabled = imageExportPalette.disabled;
    imageExportPalettePreview.classList.toggle(
      "is-disabled",
      imageExportPalette.disabled,
    );
  };
  const syncPresetUi = function () {
    const preset = imageExportPreset.value;
    imageExportCustomWrap.hidden = preset !== "custom";
    if (preset !== "custom") imageExportDpi.value = preset;
  };
  const syncFormatUi = function () {
    const indexedOnly = imageExportColorDepth.value === "indexed";
    Array.from(imageExportFormat.options).forEach(function (option) {
      option.disabled = indexedOnly && !["png", "gif"].includes(option.value);
    });
    if (indexedOnly && !["png", "gif"].includes(imageExportFormat.value))
      imageExportFormat.value = "png";
    const lossy =
      imageExportFormat.value === "jpeg" || imageExportFormat.value === "webp";
    const colorDepthApplies = ["png", "gif", "jpeg", "webp"].includes(
      imageExportFormat.value,
    );
    imageExportQuality.disabled = !lossy;
    imageExportQualityWrap.classList.toggle("is-disabled", !lossy);
    imageExportAnimatedGif.disabled = imageExportFormat.value !== "gif";
    imageExportMp4.disabled = typeof window.VideoEncoder !== "function";
    imageExportColorDepth.disabled = !colorDepthApplies;
    imageExportColorDepth.parentElement.classList.toggle(
      "is-disabled",
      !colorDepthApplies,
    );
    imageExportPalette.disabled = !indexedOnly;
    imageExportPaletteWrap.classList.toggle("is-disabled", !indexedOnly);
    const mono = imageExportColorDepth.value === "mono1";
    imageExportThreshold.disabled = !mono;
    imageExportThresholdWrap.classList.toggle("is-disabled", !mono);
    imageExportQualityValue.textContent =
      Math.max(1, Math.min(100, Number(imageExportQuality.value) || 92)) + "%";
    imageExportThresholdValue.textContent = String(
      Math.max(0, Math.min(255, Number(imageExportThreshold.value) || 128)),
    );
    syncPalettePreview();
  };
  const ensureSelectedPalette = async function () {
    if (imageExportColorDepth.value !== "indexed") return;
    await TPP.ensureImageExportPaletteLoaded(
      imageExportPalette.value || "websafe",
    );
  };
  const refreshFormatUi = async function () {
    await ensureSelectedPalette();
    syncFormatUi();
  };
  const updateEstimate = function () {
    const pixels = TPP.imageExportPixels(Number(imageExportDpi.value) || 300);
    imageExportEstimate.textContent =
      "Estimated size: " +
      pixels.width +
      " × " +
      pixels.height +
      " pixels per page";
  };
  TPP.syncImageExportFormatUi = syncFormatUi;
  TPP.updateImageExportEstimate = updateEstimate;
  const schedulePreview = function () {
    TPP.scheduleImageExportPreview();
  };
  const syncPlaybackUi = function () {
    imageExportPreviewPlay.textContent = TPP.imageExportPreviewPlaying
      ? "⏸ Pause"
      : "▶ Play";
  };
  const stopPlayback = function () {
    clearTimeout(TPP.imageExportPreviewPlaybackTimer);
    TPP.imageExportPreviewPlaybackTimer = null;
    TPP.imageExportPreviewPlaying = false;
    syncPlaybackUi();
  };
  const schedulePlayback = function () {
    clearTimeout(TPP.imageExportPreviewPlaybackTimer);
    if (!TPP.imageExportPreviewPlaying || !imageExportDialog.open) return;
    const delay = TPP.imageExportFrameDelayMs(imageExportFrameDelay.value);
    TPP.imageExportPreviewPlaybackTimer = setTimeout(function () {
      TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(1);
      TPP.renderImageExportPreview();
      schedulePlayback();
    }, delay);
  };
  const refreshPlayback = function () {
    syncPlaybackUi();
    if (TPP.imageExportPreviewPlaying) schedulePlayback();
  };
  imageExportPreset.addEventListener("change", function () {
    syncPresetUi();
    saveImageExportUi();
    updateEstimate();
    schedulePreview();
  });
  imageExportFormat.addEventListener("change", async function () {
    await refreshFormatUi();
    saveImageExportUi();
    schedulePreview();
  });
  imageExportColorDepth.addEventListener("change", async function () {
    await refreshFormatUi();
    saveImageExportUi();
    schedulePreview();
  });
  imageExportQuality.addEventListener("input", function () {
    syncFormatUi();
    saveImageExportUi();
    schedulePreview();
  });
  imageExportPalette.addEventListener("change", async function () {
    await refreshFormatUi();
    saveImageExportUi();
    if (imageExportPaletteDialog.open) openPalettePreview();
    schedulePreview();
  });
  imageExportThreshold.addEventListener("input", function () {
    syncFormatUi();
    saveImageExportUi();
    schedulePreview();
  });
  imageExportFrameDelay.addEventListener("input", function () {
    imageExportFrameDelay.value = TPP.imageExportFrameDelaySeconds(
      TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
    );
    saveImageExportUi();
    TPP.updateImageExportDuration();
    refreshPlayback();
  });
  imageExportDpi.addEventListener("input", function () {
    saveImageExportUi({
      dpiPreset: "custom",
      customDpi: TPP.dpi(Number(imageExportDpi.value) || 300),
    });
    updateEstimate();
    schedulePreview();
  });
  imageExportPalettePreview.addEventListener("click", function () {
    openPalettePreview();
  });
  imageExportPaletteDialogCanvas.addEventListener("click", function (event) {
    const layout = TPP.imageExportPaletteDialogLayout;
    const index = paletteSelectionInfo(
      layout,
      imageExportPaletteDialogCanvas,
      event.clientX,
      event.clientY,
    );
    if (index == null) return;
    TPP.imageExportPaletteSelectedIndex = index;
    openPalettePreview();
  });
  imageExportPaletteDialog.addEventListener("keydown", function (event) {
    if (!imageExportPaletteDialog.open) return;
    const layout = TPP.imageExportPaletteDialogLayout;
    if (!layout || !layout.grid || !layout.palette || !layout.palette.length)
      return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const count = layout.palette.length;
    const cols = Math.max(1, Number(layout.grid.cols) || 1);
    const rows = Math.max(1, Number(layout.grid.rows) || 1);
    const current = Math.max(
      0,
      Math.min(count - 1, Number(TPP.imageExportPaletteSelectedIndex) || 0),
    );
    const row = Math.floor(current / cols);
    const col = current % cols;
    let next = current;
    const rowEndIndex = function (rowIndex) {
      const start = rowIndex * cols;
      return Math.min(count - 1, start + cols - 1);
    };
    if (event.key === "ArrowRight") next = (current + 1) % count;
    else if (event.key === "ArrowLeft") next = (current - 1 + count) % count;
    else if (event.key === "ArrowDown") {
      const nextRow = (row + 1) % rows;
      const start = nextRow * cols;
      next = Math.min(start + col, rowEndIndex(nextRow));
    } else if (event.key === "ArrowUp") {
      const nextRow = (row - 1 + rows) % rows;
      const start = nextRow * cols;
      next = Math.min(start + col, rowEndIndex(nextRow));
    } else {
      return;
    }
    event.preventDefault();
    TPP.imageExportPaletteSelectedIndex = next;
    openPalettePreview();
  });
  imageExportPreviewPrev.addEventListener("click", function () {
    TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(-1);
    TPP.renderImageExportPreview();
    refreshPlayback();
  });
  imageExportPreviewNext.addEventListener("click", function () {
    TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(1);
    TPP.renderImageExportPreview();
    refreshPlayback();
  });
  imageExportPreviewPlay.addEventListener("click", function () {
    TPP.imageExportPreviewPlaying = !TPP.imageExportPreviewPlaying;
    if (!TPP.imageExportPreviewPlaying) {
      stopPlayback();
      return;
    }
    refreshPlayback();
  });
  imageExportDownloadBefore.addEventListener("click", function () {
    TPP.downloadImageExportPreview("before");
  });
  imageExportDownloadAfter.addEventListener("click", function () {
    TPP.downloadImageExportPreview("after");
  });
  imageExportDialog.addEventListener("click", function (e) {
    const card = e.target.closest(".modal-card");
    if (e.target === imageExportDialog && !card && imageExportDialog.open) {
      stopPlayback();
      imageExportDialog.close();
      return;
    }
    const button = e.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "cancel" && imageExportDialog.open) {
      stopPlayback();
      imageExportDialog.close();
      return;
    }
    if (
      button.dataset.action === "export-images" ||
      button.dataset.action === "export-animated-gif" ||
      button.dataset.action === "export-mp4"
    ) {
      const dpi = TPP.dpi(Number(imageExportDpi.value) || 300);
      const format = imageExportFormat.value || "png";
      const quality = Math.max(
        1,
        Math.min(100, Number(imageExportQuality.value) || 92),
      );
      const colorDepth = imageExportColorDepth.value || "color24";
      const palette = imageExportPalette.value || "websafe";
      const threshold = Math.max(
        0,
        Math.min(255, Number(imageExportThreshold.value) || 128),
      );
      imageExportDpi.value = dpi;
      imageExportPreset.value = presetValues.includes(String(dpi))
        ? String(dpi)
        : "custom";
      syncPresetUi();
      syncFormatUi();
      saveImageExportUi({
        dpiPreset: imageExportPreset.value || "300",
        customDpi: TPP.dpi(Number(imageExportDpi.value) || dpi),
        dpi: dpi,
        format: format,
        quality: quality,
        colorDepth: colorDepth,
        palette: palette,
        threshold: threshold,
        frameDelay: TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
      });
      stopPlayback();
      if (imageExportDialog.open) imageExportDialog.close();
      const exportOptions = {
        dpi: dpi,
        format: format,
        quality: quality,
        colorDepth: colorDepth,
        palette: palette,
        threshold: threshold,
        frameDelay: TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
      };
      if (button.dataset.action === "export-animated-gif") {
        TPP.exportAnimatedGif(exportOptions);
      } else if (button.dataset.action === "export-mp4") {
        TPP.exportMp4(exportOptions);
      } else {
        TPP.exportImagesZip(exportOptions);
      }
    }
  });
  imageExportDialog.addEventListener("close", stopPlayback);
  imageExportPaletteDialog.addEventListener("click", function (e) {
    const card = e.target.closest(".modal-card");
    if (
      e.target === imageExportPaletteDialog &&
      !card &&
      imageExportPaletteDialog.open
    ) {
      imageExportPaletteDialog.close();
      return;
    }
    const closeButton = e.target.closest("[data-action='close']");
    if (closeButton && imageExportPaletteDialog.open)
      imageExportPaletteDialog.close();
  });
  syncPlaybackUi();
  return {};
}
