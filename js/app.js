window.TPP = window.TPP || {};

TPP.initializeRuntimeUi = function () {
  if (TPP.runtimeUiInitialized) return;
  TPP.runtimeUiInitialized = true;
  const dragPreview = document.createElement("div");
  dragPreview.className = "drag-preview-chip";
  dragPreview.setAttribute("aria-hidden", "true");
  dragPreview.innerHTML =
    '<span class="drag-preview-handle">⋮⋮</span><span class="drag-preview-label"></span>';
  document.body.appendChild(dragPreview);
  TPP.dragPreviewEl = dragPreview;
  if (TPP.UI && typeof TPP.UI.initialize === "function") {
    TPP.UI.initialize();
  } else if (typeof TPP.initializeUiState === "function") {
    TPP.initializeUiState();
  }
  if (typeof TPP.primeSvgAssets === "function") {
    TPP.primeSvgAssets([
      "svg-loading",
      "svg-broken",
      "align-left",
      "align-center",
      "align-justify",
      "align-right",
      "align-clip",
      "text-outline-control",
    ]);
  }
  TPP.bookInfoPickerCatalogs = {
    language: null,
    region: null,
  };
  TPP.bookInfoPickerDataPaths = {
    language: "data/languages.json",
    region: "data/regions.json",
  };
  TPP.bookInfoPickerState = {
    kind: "",
    entryId: "",
    query: "",
    activeIndex: -1,
  };
  TPP.readerGoPrev = async function () {
    await TPP.ensureControlModule("reader-controls");
    if (TPP.Reader && typeof TPP.Reader.goPrev === "function") {
      return TPP.Reader.goPrev();
    }
    if (typeof TPP.readerGoPrevImpl === "function") {
      return TPP.readerGoPrevImpl();
    }
  };
  TPP.readerGoNext = async function () {
    await TPP.ensureControlModule("reader-controls");
    if (TPP.Reader && typeof TPP.Reader.goNext === "function") {
      return TPP.Reader.goNext();
    }
    if (typeof TPP.readerGoNextImpl === "function") {
      return TPP.readerGoNextImpl();
    }
  };
  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = function () {
      if (el.type === "range" && TPP.positionRangeValueTooltip) {
        TPP.positionRangeValueTooltip(el);
      }
      if (
        TPP.applyCoverImageFieldDraft &&
        TPP.applyCoverImageFieldDraft(id, el)
      ) {
        if (TPP.scheduleDraftSave) {
          TPP.scheduleDraftSave(TPP.bookId(TPP.active), 180);
        } else {
          TPP.save("draft", TPP.bookId(TPP.active));
          TPP.scheduleRevisionCommit(TPP.bookId(TPP.active));
        }
        const imageSpec = TPP.coverImageFieldSpec(id);
        if (imageSpec && TPP.patchVisibleCoverTextPreview(imageSpec.location)) {
          if (TPP.renderColorPalettes) TPP.renderColorPalettes();
          return;
        }
        TPP.scheduleEditorRender(
          imageSpec && imageSpec.location === "spine" ? "preserve" : "none",
          { debounce: true, delay: 64 },
        );
        return;
      }
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize")
        document.querySelector(".customSize").hidden =
          document.getElementById("pageSize").value !== "custom";
      TPP.sync("draft");
      TPP.renderAll();
    };
    el.onchange = function () {
      if (el.type === "range" && TPP.positionRangeValueTooltip) {
        TPP.positionRangeValueTooltip(el);
      }
      if (
        TPP.applyCoverImageFieldDraft &&
        TPP.applyCoverImageFieldDraft(id, el)
      ) {
        TPP.save("draft", TPP.bookId(TPP.active));
        const imageSpec = TPP.coverImageFieldSpec(id);
        if (imageSpec && TPP.patchVisibleCoverTextPreview(imageSpec.location)) {
          if (TPP.renderColorPalettes) TPP.renderColorPalettes();
          return;
        }
        TPP.scheduleEditorRender(
          imageSpec && imageSpec.location === "spine" ? "preserve" : "none",
        );
        return;
      }
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize")
        document.querySelector(".customSize").hidden =
          document.getElementById("pageSize").value !== "custom";
      TPP.sync("draft");
      TPP.renderAll();
    };
  });
  const controls = document.querySelector(".controls");
  if (controls) {
    controls.addEventListener("input", async function (e) {
      if (e.target.matches('input[type="range"]')) {
        const rangeApi = await TPP.ensureControlModule("editor-range-controls");
        if (rangeApi && typeof rangeApi.handleInput === "function") {
          rangeApi.handleInput(e);
        }
      }
      if (e.target.closest(".text-element-group")) {
        const textApi = await TPP.ensureControlModule(
          "editor-cover-text-controls",
        );
        if (textApi && typeof textApi.handleInput === "function") {
          return textApi.handleInput(e);
        }
      }
      if (e.target.closest(".book-info-entry")) {
        const bookInfoApi = await TPP.ensureControlModule(
          "editor-book-info-controls",
        );
        if (bookInfoApi && typeof bookInfoApi.handleInput === "function") {
          return bookInfoApi.handleInput(e);
        }
      }
    });
    controls.addEventListener("change", async function (e) {
      if (e.target.matches('input[type="range"]')) {
        const rangeApi = await TPP.ensureControlModule("editor-range-controls");
        if (rangeApi && typeof rangeApi.handleChange === "function") {
          rangeApi.handleChange(e);
        }
      }
      if (e.target.closest(".text-element-group")) {
        const textApi = await TPP.ensureControlModule(
          "editor-cover-text-controls",
        );
        if (textApi && typeof textApi.handleChange === "function") {
          return textApi.handleChange(e);
        }
      }
      if (e.target.closest(".book-info-entry")) {
        const bookInfoApi = await TPP.ensureControlModule(
          "editor-book-info-controls",
        );
        if (bookInfoApi && typeof bookInfoApi.handleChange === "function") {
          return bookInfoApi.handleChange(e);
        }
      }
      if (e.target.closest("#bookInfoAddField")) {
        const bookInfoApi = await TPP.ensureControlModule(
          "editor-book-info-controls",
        );
        if (bookInfoApi && typeof bookInfoApi.handleChange === "function") {
          return bookInfoApi.handleChange(e);
        }
      }
    });
    controls.addEventListener("click", async function (e) {
      if (
        e.target.closest(".rotation-step-cycle") ||
        e.target.matches('input[type="range"]')
      ) {
        const rangeApi = await TPP.ensureControlModule("editor-range-controls");
        if (rangeApi && typeof rangeApi.handleClick === "function") {
          const handled = rangeApi.handleClick(e);
          if (handled) return;
        }
      }
      if (
        e.target.closest(".color-picker-trigger") ||
        e.target.closest("[data-color-swatch-target]") ||
        e.target.closest("[data-text-align-cycle]") ||
        e.target.closest("[data-custom-text-edit]") ||
        e.target.closest("[data-text-action]") ||
        e.target.closest("#openFrontCoverFieldPicker")
      ) {
        const textApi = await TPP.ensureControlModule(
          "editor-cover-text-controls",
        );
        if (textApi && typeof textApi.handleClick === "function") {
          const handled = textApi.handleClick(e, controls);
          if (handled) return;
        }
      }
      if (
        e.target.closest("[data-book-info-picker]") ||
        e.target.closest("[data-book-info-classification]") ||
        e.target.closest("[data-book-info-authors]") ||
        e.target.closest("[data-book-info-action]") ||
        e.target.closest("[data-book-info-help-toggle]") ||
        e.target.closest("#bookInfoAddButton")
      ) {
        const bookInfoApi = await TPP.ensureControlModule(
          "editor-book-info-controls",
        );
        if (bookInfoApi && typeof bookInfoApi.handleClick === "function") {
          const handled = bookInfoApi.handleClick(e);
          if (handled) return;
        }
      }
    });
    controls.addEventListener("focusin", async function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      const api = await TPP.ensureControlModule("editor-range-controls");
      if (api && typeof api.handleFocusIn === "function") {
        api.handleFocusIn(e);
      }
    });
    controls.addEventListener("pointerdown", async function (e) {
      if (e.target.matches('input[type="range"]')) {
        const rangeApi = await TPP.ensureControlModule("editor-range-controls");
        if (rangeApi && typeof rangeApi.handlePointerDown === "function") {
          rangeApi.handlePointerDown(e);
        }
        return;
      }
      if (e.target.closest(".color-picker-trigger")) {
        e.preventDefault();
        e.stopPropagation();
        const textApi = await TPP.ensureControlModule(
          "editor-cover-text-controls",
        );
        if (textApi && typeof textApi.handleMouseDown === "function") {
          const handled = textApi.handleMouseDown(e);
          if (handled) return;
        }
      }
    });
    controls.addEventListener("pointerover", async function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      const api = await TPP.ensureControlModule("editor-range-controls");
      if (api && typeof api.handlePointerOver === "function") {
        api.handlePointerOver(e);
      }
    });
    controls.addEventListener("pointerout", async function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      const api = await TPP.ensureControlModule("editor-range-controls");
      if (api && typeof api.handlePointerOut === "function") {
        api.handlePointerOut(e);
      }
    });
    controls.addEventListener("focusout", async function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      const api = await TPP.ensureControlModule("editor-range-controls");
      if (api && typeof api.handleFocusOut === "function") {
        api.handleFocusOut(e);
      }
    });
    controls.addEventListener("pointerup", async function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      const api = await TPP.ensureControlModule("editor-range-controls");
      if (api && typeof api.handlePointerUp === "function") {
        api.handlePointerUp(e);
      }
    });
    controls.addEventListener("mousedown", async function (e) {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleMouseDown === "function") {
        api.handleMouseDown(e);
      }
    });
    controls.addEventListener("dragstart", async function (e) {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleDragStart === "function") {
        api.handleDragStart(e, controls);
      }
    });
    controls.addEventListener("dragover", async function (e) {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleDragOver === "function") {
        api.handleDragOver(e, controls);
      }
    });
    controls.addEventListener("dragleave", async function (e) {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleDragLeave === "function") {
        api.handleDragLeave(e);
      }
    });
    controls.addEventListener("drop", async function (e) {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleDrop === "function") {
        api.handleDrop(e, controls);
      }
    });
    controls.addEventListener("dragend", async function () {
      const api = await TPP.ensureControlModule("editor-drag-controls");
      if (api && typeof api.handleDragEnd === "function") {
        api.handleDragEnd(controls);
      }
    });
  }
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
};

TPP.openImageExportDialog = async function () {
  if (
    typeof TPP.ensureControlModule === "function" &&
    !document.getElementById("imageExportDialog")
  ) {
    return TPP.ensureControlModule("image-export-dialog").then(function () {
      return TPP.openImageExportDialog();
    });
  }
  const dialog = document.getElementById("imageExportDialog");
  const preset = document.getElementById("imageExportDialogPreset");
  const input = document.getElementById("imageExportDialogDpi");
  const customWrap = document.getElementById("imageExportDialogCustomWrap");
  const format = document.getElementById("imageExportDialogFormat");
  const colorDepth = document.getElementById("imageExportDialogColorDepth");
  const quality = document.getElementById("imageExportDialogQuality");
  const qualityWrap = document.getElementById("imageExportDialogQualityWrap");
  const qualityValue = document.getElementById("imageExportDialogQualityValue");
  const palette = document.getElementById("imageExportDialogPalette");
  const paletteWrap = document.getElementById("imageExportDialogPaletteWrap");
  const frameDelay = document.getElementById("imageExportFrameDelay");
  const threshold = document.getElementById("imageExportDialogThreshold");
  const dither = document.getElementById("imageExportDialogDither");
  const ditherWrap = document.getElementById("imageExportDialogDitherWrap");
  const thresholdWrap = document.getElementById(
    "imageExportDialogThresholdWrap",
  );
  const thresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  if (
    !dialog ||
    !preset ||
    !input ||
    !customWrap ||
    !format ||
    !colorDepth ||
    !quality ||
    !qualityWrap ||
    !qualityValue ||
    !palette ||
    !paletteWrap ||
    !frameDelay ||
    !threshold ||
    !dither ||
    !ditherWrap ||
    !thresholdWrap ||
    !thresholdValue ||
    typeof dialog.showModal !== "function"
  )
    return;
  const ui = TPP.imageExportUi();
  const presetValues = ["72", "96", "150", "200", "300", "600", "320x200"];
  const dpiPreset =
    ui.dpiPreset === "320x200" ||
    (Number(ui.targetWidth) === 320 && Number(ui.targetHeight) === 200)
      ? "320x200"
      : ui.dpiPreset === "custom"
      ? "custom"
      : presetValues.includes(String(ui.dpiPreset))
        ? String(ui.dpiPreset)
        : presetValues.includes(String(ui.dpi || 300))
          ? String(ui.dpi || 300)
          : "custom";
  const customDpi = TPP.dpi(ui.customDpi || ui.dpi || 300);
  const dpi =
    dpiPreset === "custom"
      ? customDpi
      : dpiPreset === "320x200"
        ? TPP.dpi(ui.dpi || 300)
        : TPP.dpi(dpiPreset);
  input.value = dpi;
  colorDepth.value =
    ui.colorDepth === "websafe" ? "indexed" : ui.colorDepth || "color24";
  format.value =
    colorDepth.value === "indexed" && !["png", "gif"].includes(ui.format)
      ? "png"
      : ui.format || "png";
  quality.value = Math.max(1, Math.min(100, Number(ui.quality) || 92));
  palette.value =
    ui.palette || (ui.colorDepth === "websafe" ? "websafe" : "websafe");
  frameDelay.value = TPP.imageExportFrameDelaySeconds(ui.frameDelay || 300);
  threshold.value = TPP.imageExportClampThreshold(ui.threshold);
  dither.value = ui.dithering === "none" ? "threshold" : ui.dithering || "threshold";
  qualityValue.textContent = quality.value + "%";
  thresholdValue.textContent = threshold.value;
  preset.value = dpiPreset;
  customWrap.hidden = preset.value !== "custom";
  if (TPP.preloadImageExportPalettes) {
    await TPP.preloadImageExportPalettes();
  }
  await TPP.ensureImageExportPaletteLoaded(palette.value || "websafe");
  await TPP.ensureImageExportPaletteForOptionsLoaded({
    colorDepth: colorDepth.value || "color24",
    palette: palette.value || "websafe",
  });
  if (TPP.refreshImageExportFormatUi) {
    await TPP.refreshImageExportFormatUi();
  } else if (TPP.syncImageExportFormatUi) {
    TPP.syncImageExportFormatUi();
  }
  if (TPP.updateImageExportEstimate) TPP.updateImageExportEstimate();
  TPP.updateImageExportDuration();
  TPP.imageExportPreviewIndex = 0;
  TPP.imageExportPreviewPlaying = false;
  dialog.showModal();
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(function () {
      TPP.scheduleImageExportPreview();
    });
  } else {
    TPP.scheduleImageExportPreview();
  }
};

TPP.toast = function (message) {
  const showToast = function () {
    const toast = document.getElementById("toast");
    if (!toast) return;
    clearTimeout(TPP.toastTimer);
    toast.textContent = message;
    if (toast.open && typeof toast.close === "function") toast.close();
    if (typeof toast.showModal === "function") toast.showModal();
    toast.classList.add("show");
    TPP.toastTimer = setTimeout(function () {
      toast.classList.remove("show");
      setTimeout(function () {
        if (toast.open && typeof toast.close === "function") toast.close();
      }, 180);
    }, 1800);
  };
  if (typeof TPP.ensureControlModule === "function") {
    TPP.ensureControlModule("toast").then(showToast);
    return;
  }
  showToast();
};
TPP.readSettingsUi = function () {
  try {
    return JSON.parse(localStorage.getItem(TPP.UI_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
TPP.writeSettingsUi = function (state) {
  localStorage.setItem(TPP.UI_STORAGE_KEY, JSON.stringify(state || {}));
};
TPP.imageExportUi = function () {
  const state = TPP.readSettingsUi();
  return Object.assign(
    {
      dpi: 300,
      dpiPreset: "300",
      customDpi: 300,
      targetWidth: null,
      targetHeight: null,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
      dithering: "threshold",
    },
    state.imageExport || {},
  );
};
TPP.writeImageExportUi = function (patch) {
  const state = TPP.readSettingsUi();
  const imageExport = Object.assign(
    {
      dpi: 300,
      dpiPreset: "300",
      customDpi: 300,
      targetWidth: null,
      targetHeight: null,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
      dithering: "threshold",
    },
    state.imageExport || {},
    patch || {},
  );
  TPP.writeSettingsUi(Object.assign({}, state, { imageExport: imageExport }));
};
TPP.imageExportTargetPixels = function (options) {
  const source = options || {};
  const width = Math.round(Number(source.targetWidth) || 0);
  const height = Math.round(Number(source.targetHeight) || 0);
  if (width > 0 && height > 0) {
    return { width: width, height: height };
  }
  return null;
};
TPP.imageExportPixels = function (dpiOrOptions) {
  const settings = TPP.settings();
  const targetPixels = TPP.imageExportTargetPixels(dpiOrOptions);
  if (targetPixels) {
    return {
      dpi: null,
      width: targetPixels.width,
      height: targetPixels.height,
    };
  }
  const source =
    dpiOrOptions && typeof dpiOrOptions === "object"
      ? dpiOrOptions.dpi
      : dpiOrOptions;
  const targetDpi = TPP.dpi(source);
  return {
    dpi: targetDpi,
    width: Math.round(settings.page.w * targetDpi),
    height: Math.round(settings.page.h * targetDpi),
  };
};
TPP.imageExportPreviewIndex = 0;
TPP.imageExportPreviewSplit = 50;
TPP.imageExportPreviewAssets = null;
TPP.imageExportPreviewPlaying = false;
TPP.imageExportPreviewRenderCache = null;
TPP.imageExportPreviewResultCache = new Map();
TPP.IMAGE_EXPORT_PREVIEW_RESULT_CACHE_LIMIT = 48;
TPP.imageExportPreviewLoadingTimer = null;
TPP.IMAGE_EXPORT_PREVIEW_SPINNER_DELAY_MS = 400;
TPP.imageExportFrameDelayMs = function (value) {
  return Math.max(
    1000,
    Math.min(10000, Math.round((Number(value) || 1) * 1000)),
  );
};
TPP.imageExportFrameDelaySeconds = function (value) {
  const ms = Math.max(1000, Math.min(10000, Number(value) || 1000));
  return (ms / 1000).toFixed(1).replace(/\.0$/, "");
};
TPP.imageExportDurationText = function (pageCount, frameDelayMs) {
  const totalSeconds =
    Math.max(0, Number(pageCount) || 0) *
    (Math.max(1000, Math.min(10000, Number(frameDelayMs) || 1000)) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsLabel = Number.isInteger(seconds)
    ? String(seconds)
    : seconds.toFixed(1).replace(/\.0$/, "");
  if (minutes <= 0)
    return secondsLabel + " second" + (Number(secondsLabel) === 1 ? "" : "s");
  return (
    minutes +
    " minute" +
    (minutes === 1 ? "" : "s") +
    " " +
    secondsLabel +
    " second" +
    (Number(secondsLabel) === 1 ? "" : "s")
  );
};
TPP.updateImageExportDuration = function (pageCount) {
  const el = document.getElementById("imageExportPreviewDuration");
  const input = document.getElementById("imageExportFrameDelay");
  if (!el || !input) return;
  const count =
    Number(pageCount) ||
    Number(TPP.imageExportPreviewPageCount) ||
    TPP.buildPages().length;
  el.textContent =
    "Total duration: " +
    TPP.imageExportDurationText(
      count,
      TPP.imageExportFrameDelayMs(input.value),
    );
};
TPP.nextImageExportPreviewIndex = function (step) {
  const count = TPP.buildPages().length;
  if (!count) return 0;
  const delta = Number(step) || 0;
  return (
    ((((Number(TPP.imageExportPreviewIndex) || 0) + delta) % count) + count) %
    count
  );
};
TPP.imageExportClampThreshold = function (value) {
  const raw = Number(value);
  return Math.max(0, Math.min(255, Number.isFinite(raw) ? raw : 128));
};
TPP.cancelImageExportPreviewSchedule = function () {
  clearTimeout(TPP.imageExportPreviewTimer);
  TPP.imageExportPreviewTimer = null;
  if (
    TPP.imageExportPreviewIdle &&
    typeof window.cancelIdleCallback === "function"
  ) {
    window.cancelIdleCallback(TPP.imageExportPreviewIdle);
    TPP.imageExportPreviewIdle = null;
  }
};
TPP.scheduleImageExportPreview = function () {
  TPP.cancelImageExportPreviewSchedule();
  TPP.imageExportPreviewTimer = setTimeout(function () {
    TPP.imageExportPreviewTimer = null;
    const run = function () {
      TPP.imageExportPreviewIdle = null;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(function () {
          TPP.renderImageExportPreview();
        });
      } else {
        window.setTimeout(function () {
          TPP.renderImageExportPreview();
        }, 0);
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      TPP.imageExportPreviewIdle = window.requestIdleCallback(run, {
        timeout: 400,
      });
      return;
    }
    window.requestAnimationFrame(run);
  }, 180);
};
TPP.imageExportPreviewCacheKey = function (settings, pageIndex, scale) {
  const source = settings || {};
  return JSON.stringify({
    bookId: typeof TPP.bookId === "function" ? TPP.bookId(source) : "",
    updatedAt:
      typeof TPP.bookUpdatedAt === "function" ? TPP.bookUpdatedAt(source) : "",
    revision:
      typeof TPP.bookRevisionLabel === "function"
        ? TPP.bookRevisionLabel(source)
        : "",
    pageIndex: Math.max(0, Number(pageIndex) || 0),
    pageWidth: Number(source.page && source.page.w) || 0,
    pageHeight: Number(source.page && source.page.h) || 0,
    scale: Number(scale) || 1,
  });
};
TPP.imageExportPreviewBeforeCacheKey = function (
  settings,
  pageIndex,
  scale,
  exportOptions,
) {
  const options = exportOptions || {};
  return (
    TPP.imageExportPreviewCacheKey(settings, pageIndex, scale) +
    "::before::" +
    JSON.stringify({
      targetWidth: Number(options.targetWidth) || 0,
      targetHeight: Number(options.targetHeight) || 0,
    })
  );
};
TPP.imageExportPreviewAfterCacheKey = function (
  settings,
  pageIndex,
  scale,
  exportOptions,
) {
  const options = exportOptions || {};
  return (
    TPP.imageExportPreviewCacheKey(settings, pageIndex, scale) +
    "::after::" +
    JSON.stringify({
      format: String(options.format || "png"),
      dpi: Number(options.dpi) || 300,
      targetWidth: Number(options.targetWidth) || 0,
      targetHeight: Number(options.targetHeight) || 0,
      colorDepth: String(options.colorDepth || "color24"),
      palette: String(options.palette || "websafe"),
      threshold: TPP.imageExportClampThreshold(options.threshold),
      dithering: String(options.dithering || "threshold"),
      quality: Number(options.quality) || 92,
    })
  );
};
TPP.getImageExportPreviewResultCache = function (key) {
  const cacheKey = String(key || "");
  if (!cacheKey || !TPP.imageExportPreviewResultCache.has(cacheKey)) return null;
  const entry = TPP.imageExportPreviewResultCache.get(cacheKey);
  TPP.imageExportPreviewResultCache.delete(cacheKey);
  TPP.imageExportPreviewResultCache.set(cacheKey, entry);
  return entry || null;
};
TPP.setImageExportPreviewResultCache = function (key, value) {
  const cacheKey = String(key || "");
  if (!cacheKey || !value) return value || null;
  if (TPP.imageExportPreviewResultCache.has(cacheKey)) {
    TPP.imageExportPreviewResultCache.delete(cacheKey);
  }
  TPP.imageExportPreviewResultCache.set(cacheKey, value);
  while (
    TPP.imageExportPreviewResultCache.size >
    TPP.IMAGE_EXPORT_PREVIEW_RESULT_CACHE_LIMIT
  ) {
    const oldest = TPP.imageExportPreviewResultCache.keys().next();
    if (oldest && !oldest.done) {
      TPP.imageExportPreviewResultCache.delete(oldest.value);
    } else {
      break;
    }
  }
  return value;
};
TPP.clearImageExportPreviewResultCache = function () {
  TPP.imageExportPreviewResultCache.clear();
};
TPP.imageExportPreviewScale = function (settings, exportOptions, stage) {
  const source = settings || {};
  const pageWidthCss = Math.max(1, (Number(source.page && source.page.w) || 1) * 96);
  const pageHeightCss = Math.max(
    1,
    (Number(source.page && source.page.h) || 1) * 96,
  );
  const options = exportOptions || {};
  const targetPixels = TPP.imageExportTargetPixels(options);
  const fullScale = targetPixels
    ? Math.max(
        1,
        targetPixels.width / pageWidthCss,
        targetPixels.height / pageHeightCss,
      )
    : Math.max(1, TPP.dpi(options.dpi) / 96);
  const rect = stage && typeof stage.getBoundingClientRect === "function"
    ? stage.getBoundingClientRect()
    : { width: 0, height: 0 };
  const deviceScale = Math.max(
    1,
    Math.min(2, Number(window.devicePixelRatio) || 1),
  );
  const widthScale = rect.width
    ? (rect.width * deviceScale) / pageWidthCss
    : 1;
  const heightScale = rect.height
    ? (rect.height * deviceScale) / pageHeightCss
    : 1;
  const fittedScale = Math.max(1, Math.max(widthScale, heightScale));
  const maxPreviewPixels = 900;
  const maxDimensionScale =
    maxPreviewPixels / Math.max(pageWidthCss, pageHeightCss);
  return Math.max(1, Math.min(fullScale, fittedScale, maxDimensionScale));
};
TPP.revokeImageExportPreviewAssets = function (assets) {
  ["before", "after"].forEach(function (key) {
    const entry = assets && assets[key];
    if (entry && entry.src && String(entry.src).startsWith("blob:"))
      URL.revokeObjectURL(entry.src);
  });
};
TPP.setImageExportPreviewDownloads = function (assets) {
  TPP.revokeImageExportPreviewAssets(TPP.imageExportPreviewAssets);
  TPP.imageExportPreviewAssets = assets || null;
  TPP.setImageExportPreviewDownloadButtonsDisabled(!(assets && assets.before), !(assets && assets.after));
};
TPP.setImageExportPreviewDownloadButtonsDisabled = function (
  beforeDisabled,
  afterDisabled,
) {
  const beforeButton = document.getElementById("imageExportDownloadBefore");
  const afterButton = document.getElementById("imageExportDownloadAfter");
  if (beforeButton) beforeButton.disabled = !!beforeDisabled;
  if (afterButton) afterButton.disabled = !!afterDisabled;
};
TPP.setImageExportPreviewLoading = function (stage, loading, message) {
  if (!stage) return;
  let overlay = stage.querySelector(".image-export-preview-loading");
  if (!overlay && loading) {
    overlay = document.createElement("div");
    overlay.className = "image-export-preview-loading";
    overlay.innerHTML =
      '<div class="image-export-preview-spinner" aria-hidden="true"></div>' +
      '<div class="image-export-preview-loading-text"></div>';
    stage.appendChild(overlay);
  }
  if (!overlay) return;
  overlay.hidden = !loading;
  const text = overlay.querySelector(".image-export-preview-loading-text");
  if (text) text.textContent = message || "Rendering preview...";
};
TPP.preloadImageExportPreviewSource = function (src) {
  if (!src) return Promise.resolve();
  return new Promise(function (resolve) {
    const image = new Image();
    const done = function () {
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    image.src = src;
    if (typeof image.decode === "function") {
      image.decode().then(done).catch(done);
    }
  });
};
TPP.imageExportPreviewSizeLabel = function (entry) {
  if (entry && entry.blob) {
    return TPP.fileBytesLabel
      ? TPP.fileBytesLabel(entry.blob.size || 0)
      : String(entry.blob.size || 0);
  }
  return "Preview";
};
TPP.updateImageExportPreviewStageSizeLabels = function (
  stage,
  beforeLabel,
  afterLabel,
) {
  if (!stage) return;
  const before = stage.querySelector(
    ".image-export-compare-label.before .image-export-compare-size",
  );
  const after = stage.querySelector(
    ".image-export-compare-label.after .image-export-compare-size",
  );
  if (before) before.textContent = beforeLabel || "Preview";
  if (after) after.textContent = afterLabel || "Preview";
};
TPP.cancelImageExportPreviewLoadingTimer = function () {
  if (!TPP.imageExportPreviewLoadingTimer) return;
  clearTimeout(TPP.imageExportPreviewLoadingTimer);
  TPP.imageExportPreviewLoadingTimer = null;
};
TPP.scheduleImageExportPreviewLoading = function (stage, token, message) {
  TPP.cancelImageExportPreviewLoadingTimer();
  TPP.imageExportPreviewLoadingTimer = setTimeout(function () {
    TPP.imageExportPreviewLoadingTimer = null;
    if (TPP.imageExportPreviewToken !== token) return;
    TPP.setImageExportPreviewLoading(stage, true, message || "Rendering preview...");
  }, TPP.IMAGE_EXPORT_PREVIEW_SPINNER_DELAY_MS);
};
TPP.nextFrame = function () {
  return new Promise(function (resolve) {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        resolve();
      });
      return;
    }
    window.setTimeout(resolve, 16);
  });
};
TPP.downloadImageExportPreview = async function (which) {
  const assets = TPP.imageExportPreviewAssets;
  const entry =
    which === "after" ? assets && assets.after : assets && assets.before;
  if (!entry || !entry.name || (!entry.blob && !entry.src)) return;
  try {
    if (entry.blob) {
      TPP.downloadBlob(entry.name, entry.blob);
      return;
    }
    const response = await fetch(entry.src);
    const blob = await response.blob();
    entry.blob = blob;
    TPP.downloadBlob(entry.name, blob);
  } catch (_error) {
    TPP.toast("Unable to download preview image.");
  }
};
TPP.applyImageExportPreviewSplit = function (split) {
  const compare = document.querySelector(
    "#imageExportPreviewStage .image-export-compare",
  );
  if (!compare) return;
  const normalized = Math.max(0, Math.min(100, Number(split) || 50));
  TPP.imageExportPreviewSplit = normalized;
  const before = compare.querySelector(".image-export-compare-before");
  const after = compare.querySelector(".image-export-compare-after");
  const divider = compare.querySelector(".image-export-compare-divider");
  if (before) {
    before.style.clipPath = "inset(0 " + (100 - normalized) + "% 0 0)";
  }
  if (after) after.style.clipPath = "inset(0 0 0 " + normalized + "%)";
  if (divider) divider.style.left = normalized + "%";
};
TPP.bindImageExportPreviewDrag = function () {
  const compare = document.querySelector(
    "#imageExportPreviewStage .image-export-compare",
  );
  if (!compare) return;
  let dragging = false;
  const update = function (clientX) {
    const rect = compare.getBoundingClientRect();
    if (!rect.width) return;
    const split = ((clientX - rect.left) / rect.width) * 100;
    TPP.applyImageExportPreviewSplit(split);
  };
  compare.onpointerdown = function (event) {
    dragging = true;
    compare.setPointerCapture(event.pointerId);
    update(event.clientX);
  };
  compare.onpointermove = function (event) {
    if (!dragging) return;
    update(event.clientX);
  };
  compare.onpointerup = function (event) {
    dragging = false;
    if (compare.hasPointerCapture(event.pointerId))
      compare.releasePointerCapture(event.pointerId);
  };
  compare.onpointercancel = function (event) {
    dragging = false;
    if (compare.hasPointerCapture(event.pointerId))
      compare.releasePointerCapture(event.pointerId);
  };
  TPP.applyImageExportPreviewSplit(TPP.imageExportPreviewSplit);
};
TPP.renderImageExportPreview = async function () {
  const dialog = document.getElementById("imageExportDialog");
  const stage = document.getElementById("imageExportPreviewStage");
  const label = document.getElementById("imageExportPreviewLabel");
  const format = document.getElementById("imageExportDialogFormat");
  const colorDepth = document.getElementById("imageExportDialogColorDepth");
  const quality = document.getElementById("imageExportDialogQuality");
  const palette = document.getElementById("imageExportDialogPalette");
  const preset = document.getElementById("imageExportDialogPreset");
  const threshold = document.getElementById("imageExportDialogThreshold");
  const dither = document.getElementById("imageExportDialogDither");
  const dpi = document.getElementById("imageExportDialogDpi");
  const thresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  if (
    !dialog ||
    !dialog.open ||
    !stage ||
    !label ||
    !format ||
    !colorDepth ||
    !quality ||
    !palette ||
    !preset ||
    !threshold ||
    !dither ||
    !thresholdValue ||
    !dpi ||
    !TPP.renderImageExportPreviewCanvas
  )
    return;
  const token = (TPP.imageExportPreviewToken || 0) + 1;
  TPP.imageExportPreviewToken = token;
  TPP.cancelImageExportPreviewLoadingTimer();
  TPP.setImageExportPreviewLoading(stage, false);
  TPP.setImageExportPreviewDownloadButtonsDisabled(true, true);
  if (!stage.firstElementChild) {
    stage.innerHTML =
      '<div class="image-export-preview-empty">Preview unavailable</div>';
  }
  await Promise.resolve();
  TPP.sync("nosave");
  const pages = TPP.buildPages();
  TPP.imageExportPreviewPageCount = pages.length;
  TPP.updateImageExportDuration(pages.length);
  if (!pages.length) {
    TPP.cancelImageExportPreviewLoadingTimer();
    TPP.setImageExportPreviewLoading(stage, false);
    TPP.setImageExportPreviewDownloads(null);
    stage.innerHTML =
      '<div class="image-export-preview-empty">No pages available to preview</div>';
    label.textContent = "No preview pages";
    return;
  }
  TPP.imageExportPreviewIndex = Math.max(
    0,
    Math.min(TPP.imageExportPreviewIndex || 0, pages.length - 1),
  );
  label.textContent =
    "Preview page " + (TPP.imageExportPreviewIndex + 1) + " of " + pages.length;
  if (typeof TPP.refreshImageExportCharsetPreviewIcon === "function") {
    TPP.refreshImageExportCharsetPreviewIcon();
  }
  const settings = TPP.settings();
  const exportOptions = TPP.imageExportOptions({
    dpi: Number(dpi.value) || 300,
    targetWidth: String(preset.value || "") === "320x200" ? 320 : null,
    targetHeight: String(preset.value || "") === "320x200" ? 200 : null,
    format: format.value || "png",
    quality: Number(quality.value) || 92,
    colorDepth: colorDepth.value || "color24",
    palette: palette.value || "websafe",
    threshold: TPP.imageExportClampThreshold(threshold.value),
    dithering: dither.value || "threshold",
  });
  const exportPixels = TPP.imageExportPixels(exportOptions);
  stage.style.setProperty(
    "--image-export-preview-ratio",
    exportPixels.width + " / " + exportPixels.height,
  );
  await TPP.ensureImageExportPaletteForOptionsLoaded(exportOptions);
  const previewScale = TPP.imageExportPreviewScale(
    settings,
    exportOptions,
    stage,
  );
  const beforeCacheKey = TPP.imageExportPreviewBeforeCacheKey(
    settings,
    TPP.imageExportPreviewIndex,
    previewScale,
    exportOptions,
  );
  const afterCacheKey = TPP.imageExportPreviewAfterCacheKey(
    settings,
    TPP.imageExportPreviewIndex,
    previewScale,
    exportOptions,
  );
  const cachedBefore = TPP.getImageExportPreviewResultCache(beforeCacheKey) || {};
  const cachedAfter = TPP.getImageExportPreviewResultCache(afterCacheKey) || {};
  const customCharsetPreview =
    exportOptions.colorDepth === "indexed" &&
    exportOptions.dithering === "c64-custom-charset";
  const previewCacheKey = TPP.imageExportPreviewCacheKey(
    settings,
    TPP.imageExportPreviewIndex,
    previewScale,
  );
  const beforeName =
    typeof TPP.exportPageFileName === "function"
      ? TPP.exportPageFileName(settings, TPP.imageExportPreviewIndex + 1, {
          extension: "png",
          qualifiers: ["before"],
          totalPages: pages.length,
        })
      : "tiny-book-page-" + String(TPP.imageExportPreviewIndex + 1) + "-before.png";
  const afterName =
    typeof TPP.exportPageFileName === "function"
      ? TPP.exportPageFileName(settings, TPP.imageExportPreviewIndex + 1, {
          format: exportOptions.format,
          qualifiers: ["after"],
          totalPages: pages.length,
        })
      : "tiny-book-page-" +
        String(TPP.imageExportPreviewIndex + 1) +
        "-after." +
        (exportOptions.format === "jpeg" ? "jpg" : exportOptions.format);
  const compareStageStyle = function () {
    return (
      "width:min(100%," +
      Math.max(1, Number(exportPixels.width) || 1) +
      "px);height:min(100%," +
      Math.max(1, Number(exportPixels.height) || 1) +
      "px)"
    );
  };
  const compareStageMarkup = function (beforeSrc, afterSrc, beforeSize, afterSize) {
    return (
      '<div class="image-export-compare" style="' +
      compareStageStyle() +
      '">' +
      '<img draggable="false" class="image-export-compare-before" src="' +
      TPP.esc(beforeSrc || "") +
      '" alt="Original preview">' +
      (afterSrc
        ? '<img draggable="false" class="image-export-compare-after" src="' +
          TPP.esc(afterSrc) +
          '" alt="Exported preview">'
        : '<div class="image-export-compare-after image-export-compare-after-empty" aria-hidden="true"></div>') +
      '<div class="image-export-compare-divider"></div>' +
      '<div class="image-export-compare-label before">Before<span class="image-export-compare-size">' +
      TPP.esc(beforeSize || "Preview") +
      "</span></div>" +
      '<div class="image-export-compare-label after">After<span class="image-export-compare-size">' +
      TPP.esc(afterSize || "Preview") +
      "</span></div>" +
      "</div>"
    );
  };
  const renderLiveBeforeStage = function (page, settings, exportOptions) {
    if (!page || typeof TPP.pageEl !== "function") return;
    const compare = document.createElement("div");
    compare.className = "image-export-compare image-export-compare-live";
    compare.style.cssText = compareStageStyle();
    const beforePane = document.createElement("div");
    beforePane.className = "image-export-compare-pane image-export-compare-before";
    const afterPane = document.createElement("div");
    afterPane.className = "image-export-compare-pane image-export-compare-after image-export-compare-after-empty";
    const divider = document.createElement("div");
    divider.className = "image-export-compare-divider";
    const beforeLabel = document.createElement("div");
    beforeLabel.className = "image-export-compare-label before";
    beforeLabel.innerHTML =
      'Before<span class="image-export-compare-size">' +
      TPP.esc(TPP.imageExportPreviewSizeLabel(null)) +
      "</span>";
    const afterLabel = document.createElement("div");
    afterLabel.className = "image-export-compare-label after";
    afterLabel.innerHTML =
      'After<span class="image-export-compare-size">Rendering...</span>';
    const targetPixels = TPP.imageExportPixels(exportOptions || {});
    const pageWidthPx = Math.max(1, Number(settings.page && settings.page.w) || 1) * 96;
    const pageHeightPx = Math.max(1, Number(settings.page && settings.page.h) || 1) * 96;
    const scaleX = Math.max(1, Number(targetPixels.width) || 1) / pageWidthPx;
    const scaleY = Math.max(1, Number(targetPixels.height) || 1) / pageHeightPx;
    const createLivePage = function () {
      const shell = document.createElement("div");
      shell.className = "image-export-live-preview-shell";
      const pageEl = TPP.pageEl(page, settings, 0, 0, false, true);
      pageEl.style.transformOrigin = "center center";
      pageEl.style.transform =
        "translate(-50%, -50%) scale(" + scaleX + "," + scaleY + ")";
      shell.appendChild(pageEl);
      return shell;
    };
    beforePane.appendChild(createLivePage());
    compare.appendChild(beforePane);
    compare.appendChild(afterPane);
    compare.appendChild(divider);
    compare.appendChild(beforeLabel);
    compare.appendChild(afterLabel);
    stage.replaceChildren(compare);
    TPP.bindImageExportPreviewDrag();
  };
  const renderBeforeStage = async function (beforeEntry) {
    const beforeSrc = beforeEntry && beforeEntry.src ? beforeEntry.src : "";
    await TPP.preloadImageExportPreviewSource(beforeSrc);
    if (TPP.imageExportPreviewToken !== token) {
      return;
    }
    stage.innerHTML = compareStageMarkup(
      beforeSrc,
      "",
      TPP.imageExportPreviewSizeLabel(beforeEntry),
      "Rendering...",
    );
    TPP.bindImageExportPreviewDrag();
  };
  const renderPreviewStage = async function (beforeEntry, afterEntry) {
    const beforeSrc = beforeEntry && beforeEntry.src ? beforeEntry.src : "";
    const afterSrc = afterEntry && afterEntry.src ? afterEntry.src : "";
    await Promise.all([
      TPP.preloadImageExportPreviewSource(beforeSrc),
      TPP.preloadImageExportPreviewSource(afterSrc),
    ]);
    if (TPP.imageExportPreviewToken !== token) {
      return;
    }
    stage.innerHTML = compareStageMarkup(
      beforeSrc,
      afterSrc,
      TPP.imageExportPreviewSizeLabel(beforeEntry),
      TPP.imageExportPreviewSizeLabel(afterEntry),
    );
    TPP.setImageExportPreviewLoading(stage, false);
    TPP.setImageExportPreviewDownloads({
      before: {
        src: beforeSrc,
        blob: beforeEntry ? beforeEntry.blob || null : null,
        name: beforeName,
      },
      after: {
        src: afterSrc,
        blob: afterEntry ? afterEntry.blob || null : null,
        name: afterName,
      },
    });
    TPP.bindImageExportPreviewDrag();
  };
  if (cachedBefore.previewSrc && cachedAfter.previewSrc) {
    TPP.cancelImageExportPreviewLoadingTimer();
    await renderPreviewStage(
      {
        src: cachedBefore.previewSrc,
        blob: cachedBefore.blob || null,
      },
      {
        src: cachedAfter.previewSrc,
        blob: cachedAfter.blob || null,
      },
    );
    return;
  }
  if (!cachedBefore.previewSrc) {
    renderLiveBeforeStage(
      pages[TPP.imageExportPreviewIndex],
      settings,
      exportOptions,
    );
  }
  if (cachedBefore.previewSrc) {
    await renderBeforeStage({
      src: cachedBefore.previewSrc,
      blob: cachedBefore.blob || null,
    });
    if (TPP.imageExportPreviewToken !== token) return;
    await TPP.nextFrame();
  }
  if (customCharsetPreview) {
    TPP.setImageExportPreviewLoading(stage, true, "Rendering custom charset...");
    await TPP.nextFrame();
  } else {
    TPP.scheduleImageExportPreviewLoading(stage, token, "Rendering preview...");
  }
  TPP.setImageExportPreviewDownloadButtonsDisabled(true, true);
  try {
    let baseCanvas =
      TPP.imageExportPreviewRenderCache &&
      TPP.imageExportPreviewRenderCache.key === previewCacheKey
        ? TPP.imageExportPreviewRenderCache.canvas
        : null;
    if (!baseCanvas) {
      baseCanvas = await TPP.renderImageExportPreviewCanvas(
        pages[TPP.imageExportPreviewIndex],
        settings,
        previewScale,
      );
      TPP.imageExportPreviewRenderCache = {
        key: previewCacheKey,
        canvas: baseCanvas,
      };
    }
    if (TPP.imageExportPreviewToken !== token) return;
    const beforeCanvas = typeof TPP.fitCanvasToExportTarget === "function"
      ? TPP.fitCanvasToExportTarget(baseCanvas, exportOptions)
      : baseCanvas;
    const afterCanvas = await TPP.exportCanvasForDepth(
      beforeCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
      exportOptions,
    );
    if (
      customCharsetPreview &&
      typeof TPP.primeImageExportCharsetPreview === "function"
    ) {
      TPP.primeImageExportCharsetPreview(
        afterCanvas,
        exportOptions,
        TPP.imageExportPreviewIndex,
      );
    }
    const beforeEntry = {
      previewSrc:
        cachedBefore.previewSrc || TPP.previewDataUrl(beforeCanvas, "png", 1),
      blob: cachedBefore.blob || null,
    };
    if (!cachedAfter.previewSrc) {
      TPP.setImageExportPreviewResultCache(beforeCacheKey, beforeEntry);
      if (TPP.imageExportPreviewToken !== token) return;
      await renderBeforeStage({
        src: beforeEntry.previewSrc,
        blob: beforeEntry.blob,
      });
      if (TPP.imageExportPreviewToken !== token) return;
      await TPP.nextFrame();
      TPP.setImageExportPreviewLoading(
        stage,
        true,
        customCharsetPreview ? "Rendering custom charset..." : "Rendering preview...",
      );
      if (TPP.imageExportPreviewToken !== token) return;
    }
    const afterEntry = {
      previewSrc:
        cachedAfter.previewSrc ||
        TPP.previewDataUrl(
          afterCanvas,
          exportOptions.format,
          exportOptions.quality / 100,
        ),
      blob: cachedAfter.blob || null,
    };
    TPP.setImageExportPreviewResultCache(beforeCacheKey, beforeEntry);
    TPP.setImageExportPreviewResultCache(afterCacheKey, afterEntry);
    if (TPP.imageExportPreviewToken !== token) return;
    TPP.cancelImageExportPreviewLoadingTimer();
    await renderPreviewStage(
      { src: beforeEntry.previewSrc, blob: beforeEntry.blob },
      { src: afterEntry.previewSrc, blob: afterEntry.blob },
    );
    window.setTimeout(async function () {
      if (TPP.imageExportPreviewToken !== token) return;
      if (!beforeEntry.blob) {
        beforeEntry.blob = await TPP.exportBlobForCanvas(beforeCanvas, {
          format: "png",
          quality: 100,
        });
        TPP.setImageExportPreviewResultCache(beforeCacheKey, beforeEntry);
      }
      if (TPP.imageExportPreviewToken !== token) return;
      if (!afterEntry.blob) {
        afterEntry.blob = await TPP.exportBlobForCanvas(afterCanvas, exportOptions);
        TPP.setImageExportPreviewResultCache(afterCacheKey, afterEntry);
      }
      if (TPP.imageExportPreviewToken !== token) return;
      TPP.setImageExportPreviewDownloads({
        before: {
          src: beforeEntry.previewSrc,
          blob: beforeEntry.blob || null,
          name: beforeName,
        },
        after: {
          src: afterEntry.previewSrc,
          blob: afterEntry.blob || null,
          name: afterName,
        },
      });
      TPP.updateImageExportPreviewStageSizeLabels(
        stage,
        TPP.imageExportPreviewSizeLabel(beforeEntry),
        TPP.imageExportPreviewSizeLabel(afterEntry),
      );
    }, 0);
  } catch (_error) {
    if (TPP.imageExportPreviewToken !== token) return;
    TPP.cancelImageExportPreviewLoadingTimer();
    TPP.setImageExportPreviewLoading(stage, false);
    TPP.setImageExportPreviewDownloads(null);
    stage.innerHTML =
      '<div class="image-export-preview-empty">Unable to render preview</div>';
    console.error("Image export preview failed", _error);
    if (exportOptions.format === "gif")
      TPP.toast(
        "GIF preview failed: " +
          (_error && _error.message ? _error.message : "Unknown GIF error"),
      );
  }
};
TPP.readDataTab = function (validTabs) {
  const state = TPP.readSettingsUi();
  const stored =
    state && state.dataTabByBook && TPP.active
      ? state.dataTabByBook[TPP.bookId(TPP.active)]
      : "";
  const tabs = Array.isArray(validTabs) ? validTabs : [];
  if (stored && tabs.includes(stored)) return stored;
  return tabs[0] || "top";
};
TPP.writeDataTab = function (tabId) {
  if (!TPP.active) return;
  const state = TPP.readSettingsUi();
  const dataTabByBook = Object.assign({}, state.dataTabByBook || {});
  dataTabByBook[TPP.bookId(TPP.active)] = tabId || "top";
  TPP.writeSettingsUi(
    Object.assign({}, state, { dataTabByBook: dataTabByBook }),
  );
};
TPP.readerPageOrBlank = function (pages, number) {
  return pages[number - 1] || { n: number, type: "blank", html: "" };
};
TPP.readerMiniPage = function (page, settings, pageSide) {
  const shell = document.createElement("div");
  shell.className = "reader-shell";
  shell.style.width = settings.page.w + "in";
  shell.style.height = settings.page.h + "in";
  const pageEl = TPP.pageEl(page, settings, 0, 0, false, true);
  if (pageSide) pageEl.classList.add("page-side-" + pageSide);
  shell.appendChild(pageEl);
  return shell;
};
TPP.oppositePageSide = function (side) {
  return side === "left" ? "right" : "left";
};
TPP.renderReaderDuplex = function (pages, settings, sheetIndex) {
  const preview = document.getElementById("readerPreview");
  const sheet = TPP.readerDuplexSheetPages(
    pages,
    sheetIndex,
    settings.signatureSize,
  );
  preview.innerHTML = "";
  if (!sheet) {
    preview.textContent = "No interior duplex sheets to preview yet.";
    return;
  }
  const duplex = document.createElement("div");
  duplex.className = "duplex-sheet";
  const layout = [
    {
      side: "left",
      title: "Leaf " + sheet.front.pages[0] + " / " + sheet.back.pages[1],
      front: TPP.readerPageOrBlank(pages, sheet.front.pages[0]),
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[1]),
    },
    {
      side: "right",
      title: "Leaf " + sheet.front.pages[1] + " / " + sheet.back.pages[0],
      front: TPP.readerPageOrBlank(pages, sheet.front.pages[1]),
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[0]),
    },
  ];
  TPP.readerVisiblePageRoles = layout
    .flatMap(function (leaf) {
      return [leaf.front, leaf.back];
    })
    .map(function (page) {
      return String((page && page.role) || "").trim();
    })
    .filter(Boolean);
  const readerWidth = settings.page.w * 2.45;
  const readerHeight = settings.page.h * 2.2;
  const scale = Math.min(
    4,
    Math.max(
      0.75,
      Math.min(
        (window.innerWidth - 560) / (readerWidth * 96),
        (window.innerHeight - 240) / (readerHeight * 96),
      ),
    ),
  );
  duplex.style.transform = "scale(" + scale + ")";
  layout.forEach(function (leaf) {
    const leafEl = document.createElement("div");
    leafEl.className = "duplex-leaf";
    const title = document.createElement("div");
    title.className = "duplex-leaf-label";
    title.textContent = leaf.title;
    leafEl.appendChild(title);
    [
      ["Front side", leaf.front, leaf.side, leaf.side === "left" ? 1 : -1],
      [
        "Back side",
        leaf.back,
        TPP.oppositePageSide(leaf.side),
        leaf.side === "left" ? -1 : 1,
      ],
    ].forEach(function (face) {
      const faceEl = document.createElement("div");
      faceEl.className = "duplex-face";
      const label = document.createElement("div");
      label.className = "duplex-face-label";
      label.textContent = face[0];
      faceEl.appendChild(label);
      const mini = TPP.readerMiniPage(face[1], settings, face[2]);
      mini.onclick = function () {
        TPP.readerGoToDuplexNeighbor(
          pages,
          settings,
          face[1] && face[1].n,
          face[3],
        );
      };
      faceEl.appendChild(mini);
      leafEl.appendChild(faceEl);
    });
    duplex.appendChild(leafEl);
  });
  preview.appendChild(duplex);
};
TPP.renderReader = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const mode = document.getElementById("readerMode").value;
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerIndex,
    pages,
    mode,
    settings,
  );
  TPP.saveSettingsUi();
  TPP.readerNav(pages, mode, settings);
  TPP.syncReaderProgress(pages, TPP.readerIndex, mode, settings);
  if (mode === "duplex") {
    TPP.renderReaderDuplex(pages, settings, TPP.readerIndex);
    return;
  }
  const frontCover =
    pages[TPP.readerIndex] && pages[TPP.readerIndex].role === "front";
  const spineW = frontCover ? TPP.spineWidth(settings) : 0;
  const shown =
    mode === "spread"
      ? frontCover
        ? [pages[TPP.readerIndex]]
        : [pages[TPP.readerIndex], pages[TPP.readerIndex + 1] || null]
      : [pages[TPP.readerIndex]];
  TPP.readerVisiblePageRoles = shown
    .map(function (page) {
      return String((page && page.role) || "").trim();
    })
    .filter(Boolean);
  const spread = document.createElement("div");
  spread.className = "spread";
  const readerWidth = frontCover
    ? settings.page.w + spineW
    : mode === "spread"
      ? settings.page.w * 2.25
      : settings.page.w;
  const scale = Math.min(
    5,
    Math.max(1.2, (window.innerWidth - 560) / (readerWidth * 96)),
  );
  spread.style.transform = "scale(" + scale + ")";
  shown.forEach(function (page, shownIndex) {
    const shell = document.createElement("div");
    shell.className = "reader-shell";
    const withSpine = page && page.role === "front" && spineW > 0;
    shell.style.width = settings.page.w + (withSpine ? spineW : 0) + "in";
    shell.style.height = settings.page.h + "in";
    if (withSpine) {
      shell.appendChild(TPP.spineEl(settings, spineW / 2, 0, settings.page.h));
      shell.appendChild(TPP.pageEl(page, settings, spineW, 0, false, false));
    } else if (page) {
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    }
    shell.onclick = function () {
      if (mode === "spread" && shown.length > 1 && shownIndex === 0) {
        TPP.readerGoPrev();
      } else {
        TPP.readerGoNext();
      }
    };
    spread.appendChild(shell);
  });
  document.getElementById("readerPreview").innerHTML = "";
  document.getElementById("readerPreview").appendChild(spread);
};
