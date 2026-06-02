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
      if (e.target.closest(".copyright-item-group")) {
        const copyrightApi = await TPP.ensureControlModule(
          "editor-copyright-controls",
        );
        if (copyrightApi && typeof copyrightApi.handleInput === "function") {
          return copyrightApi.handleInput(e);
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
      if (e.target.closest(".copyright-item-group")) {
        const copyrightApi = await TPP.ensureControlModule(
          "editor-copyright-controls",
        );
        if (copyrightApi && typeof copyrightApi.handleChange === "function") {
          return copyrightApi.handleChange(e);
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
        e.target.closest("[data-book-info-action]") ||
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
      if (e.target.closest("[data-copyright-action]")) {
        const copyrightApi = await TPP.ensureControlModule(
          "editor-copyright-controls",
        );
        if (copyrightApi && typeof copyrightApi.handleClick === "function") {
          return copyrightApi.handleClick(e);
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
    !thresholdWrap ||
    !thresholdValue ||
    typeof dialog.showModal !== "function"
  )
    return;
  const ui = TPP.imageExportUi();
  const presetValues = ["72", "96", "150", "200", "300", "600"];
  const dpiPreset =
    ui.dpiPreset === "custom"
      ? "custom"
      : presetValues.includes(String(ui.dpiPreset))
        ? String(ui.dpiPreset)
        : presetValues.includes(String(ui.dpi || 300))
          ? String(ui.dpi || 300)
          : "custom";
  const customDpi = TPP.dpi(ui.customDpi || ui.dpi || 300);
  const dpi = dpiPreset === "custom" ? customDpi : TPP.dpi(dpiPreset);
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
  threshold.value = Math.max(0, Math.min(255, Number(ui.threshold) || 128));
  qualityValue.textContent = quality.value + "%";
  thresholdValue.textContent = threshold.value;
  preset.value = dpiPreset;
  customWrap.hidden = preset.value !== "custom";
  await TPP.ensureImageExportPaletteForOptionsLoaded({
    colorDepth: colorDepth.value || "color24",
    palette: palette.value || "websafe",
  });
  if (TPP.syncImageExportFormatUi) TPP.syncImageExportFormatUi();
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
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
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
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
    },
    state.imageExport || {},
    patch || {},
  );
  TPP.writeSettingsUi(Object.assign({}, state, { imageExport: imageExport }));
};
TPP.imageExportPixels = function (dpi) {
  const settings = TPP.settings();
  const targetDpi = TPP.dpi(dpi);
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
  const beforeButton = document.getElementById("imageExportDownloadBefore");
  const afterButton = document.getElementById("imageExportDownloadAfter");
  if (beforeButton) beforeButton.disabled = !(assets && assets.before);
  if (afterButton) afterButton.disabled = !(assets && assets.after);
};
TPP.downloadImageExportPreview = async function (which) {
  const assets = TPP.imageExportPreviewAssets;
  const entry =
    which === "after" ? assets && assets.after : assets && assets.before;
  if (!entry || !entry.blob || !entry.name) return;
  try {
    TPP.downloadBlob(entry.name, entry.blob);
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
  const after = compare.querySelector(".image-export-compare-after");
  const divider = compare.querySelector(".image-export-compare-divider");
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
  const threshold = document.getElementById("imageExportDialogThreshold");
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
    !threshold ||
    !thresholdValue ||
    !dpi ||
    !TPP.renderImageExportPreviewCanvas
  )
    return;
  await Promise.resolve();
  TPP.sync("nosave");
  const pages = TPP.buildPages();
  TPP.imageExportPreviewPageCount = pages.length;
  TPP.updateImageExportDuration(pages.length);
  if (!pages.length) {
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
  const token = (TPP.imageExportPreviewToken || 0) + 1;
  TPP.imageExportPreviewToken = token;
  TPP.setImageExportPreviewDownloads(null);
  stage.innerHTML =
    '<div class="image-export-preview-empty">Rendering preview...</div>';
  const settings = TPP.settings();
  stage.style.setProperty(
    "--image-export-preview-ratio",
    settings.page.w + " / " + settings.page.h,
  );
  const exportOptions = TPP.imageExportOptions({
    dpi: Number(dpi.value) || 300,
    format: format.value || "png",
    quality: Number(quality.value) || 92,
    colorDepth: colorDepth.value || "color24",
    palette: palette.value || "websafe",
    threshold: Number(threshold.value) || 128,
  });
  await TPP.ensureImageExportPaletteForOptionsLoaded(exportOptions);
  thresholdValue.textContent = String(exportOptions.threshold);
  const previewScale = Math.max(1, exportOptions.dpi / 96);
  try {
    const baseCanvas = await TPP.renderImageExportPreviewCanvas(
      pages[TPP.imageExportPreviewIndex],
      settings,
      previewScale,
    );
    if (TPP.imageExportPreviewToken !== token) return;
    const beforeBlob = await TPP.exportBlobForCanvas(baseCanvas, {
      format: "png",
      quality: 100,
    });
    const afterCanvas = TPP.exportCanvasForDepth(
      baseCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
    );
    const afterBlob = await TPP.exportBlobForCanvas(afterCanvas, exportOptions);
    if (TPP.imageExportPreviewToken !== token) return;
    const beforeSrc = beforeBlob ? URL.createObjectURL(beforeBlob) : "";
    const afterSrc = afterBlob ? URL.createObjectURL(afterBlob) : "";
    const baseName = (
      (settings.title || "tiny-book") +
      "-page-" +
      (TPP.imageExportPreviewIndex + 1)
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    stage.innerHTML =
      '<div class="image-export-compare">' +
      '<img draggable="false" src="' +
      TPP.esc(beforeSrc) +
      '" alt="Original preview">' +
      '<img draggable="false" class="image-export-compare-after" src="' +
      TPP.esc(afterSrc) +
      '" alt="Exported preview">' +
      '<div class="image-export-compare-divider"></div>' +
      '<div class="image-export-compare-label before">Before<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel
          ? TPP.fileBytesLabel(beforeBlob ? beforeBlob.size : 0)
          : String(beforeBlob ? beforeBlob.size : 0),
      ) +
      "</span></div>" +
      '<div class="image-export-compare-label after">After<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel
          ? TPP.fileBytesLabel(afterBlob ? afterBlob.size : 0)
          : String(afterBlob ? afterBlob.size : 0),
      ) +
      "</span></div>" +
      "</div>";
    TPP.setImageExportPreviewDownloads({
      before: {
        src: beforeSrc,
        blob: beforeBlob,
        name: baseName + "-before.png",
      },
      after: {
        src: afterSrc,
        blob: afterBlob,
        name:
          baseName +
          "-after." +
          (exportOptions.format === "jpeg" ? "jpg" : exportOptions.format),
      },
    });
    TPP.bindImageExportPreviewDrag();
  } catch (_error) {
    if (TPP.imageExportPreviewToken !== token) return;
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
