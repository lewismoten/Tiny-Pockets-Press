window.TPP = window.TPP || {};

const renderCurrentViewPreservingSidebar = function () {
  if (TPP.view === "about") TPP.renderAbout();
  else if (TPP.view === "software") TPP.renderSoftwareAbout();
  else if (TPP.view === "data") TPP.renderData();
  else if (TPP.view === "interior") TPP.renderInterior();
  else if (TPP.view === "cover") TPP.renderCover();
  else if (TPP.view === "reader") TPP.renderReader();
  else if (TPP.view === "library") TPP.renderLibrary();
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
  if (TPP.refreshRangeInputTitles) TPP.refreshRangeInputTitles(document);
  if (TPP.refreshRotationStepButtons) {
    TPP.refreshRotationStepButtons(document);
  }
};

TPP.renderCurrentViewPreservingSidebar = renderCurrentViewPreservingSidebar;

TPP.coverImageFieldSpec = function (fieldId) {
  const field = String(fieldId || "").trim();
  const match = field.match(/^(cover|back|spine)Img(X|Y|Zoom|Rotate)$/);
  if (!match) return null;
  const locationMap = { cover: "front", back: "back", spine: "spine" };
  const propertyMap = { X: "x", Y: "y", Zoom: "zoom", Rotate: "rotate" };
  return {
    location: locationMap[match[1]] || "",
    property: propertyMap[match[2]] || "",
  };
};

TPP.applyCoverImageFieldDraft = function (fieldId, element) {
  const spec = TPP.coverImageFieldSpec(fieldId);
  const book = TPP.active;
  if (!spec || !book || !element) return false;
  const imageElement = TPP.findImageElement(book, spec.location, "cover");
  if (!imageElement) return false;
  if (element.type === "checkbox") {
    book[fieldId] = element.checked;
  } else if (element.type === "number" || element.type === "range") {
    book[fieldId] = Number(element.value);
  } else {
    book[fieldId] = element.value;
  }
  imageElement[spec.property] =
    spec.property === "zoom" ||
    spec.property === "x" ||
    spec.property === "y" ||
    spec.property === "rotate"
      ? Number(book[fieldId]) || 0
      : book[fieldId];
  if (TPP.syncLegacyImageFieldsFromElements) {
    TPP.syncLegacyImageFieldsFromElements(book);
  }
  return true;
};

let scheduledEditorRenderFrame = 0;
let scheduledEditorRenderTimer = 0;
let scheduledEditorRenderMode = "";

const editorRenderModeRank = function (mode) {
  if (mode === "full") return 4;
  if (mode === "preserve") return 3;
  if (mode === "cover" || mode === "reader") return 2;
  return 0;
};

const flushScheduledEditorRender = function () {
  scheduledEditorRenderFrame = 0;
  scheduledEditorRenderTimer = 0;
  const mode = scheduledEditorRenderMode;
  scheduledEditorRenderMode = "";
  if (mode === "full") {
    TPP.renderAll();
    return;
  }
  if (mode === "cover") {
    TPP.renderCover();
    if (TPP.renderColorPalettes) TPP.renderColorPalettes();
    return;
  }
  if (mode === "reader") {
    TPP.renderReader();
    if (TPP.renderColorPalettes) TPP.renderColorPalettes();
    return;
  }
  if (mode === "preserve") {
    renderCurrentViewPreservingSidebar();
  }
};

const editorRenderActionForTarget = function (target) {
  const textElementEntry = target && target.closest(".text-element-group");
  if (textElementEntry) {
    const location = String(textElementEntry.dataset.location || "").trim();
    if (location === "front" || location === "back" || location === "spine") {
      if (TPP.view === "cover") return "cover";
      if (TPP.view === "reader") {
        const role = location === "back" ? "back" : "front";
        return Array.isArray(TPP.readerVisiblePageRoles) &&
          TPP.readerVisiblePageRoles.includes(role)
          ? "reader"
          : "none";
      }
      return "none";
    }
  }
  return "preserve";
};

const scheduleEditorRender = function (mode, options) {
  const targetMode =
    mode === "full"
      ? "full"
      : mode === "cover"
        ? "cover"
        : mode === "reader"
          ? "reader"
          : mode === "none"
            ? "none"
            : "preserve";
  const useDebounce = !!(options && options.debounce);
  const debounceMs =
    options && Number.isFinite(options.delay) ? Number(options.delay) : 48;
  if (!scheduledEditorRenderMode) {
    scheduledEditorRenderMode = targetMode;
  } else if (targetMode === "none") {
    // Keep the existing scheduled mode.
  } else if (
    scheduledEditorRenderMode !== targetMode &&
    editorRenderModeRank(targetMode) ===
      editorRenderModeRank(scheduledEditorRenderMode) &&
    editorRenderModeRank(targetMode) > 0
  ) {
    scheduledEditorRenderMode = "preserve";
  } else if (
    editorRenderModeRank(targetMode) >
    editorRenderModeRank(scheduledEditorRenderMode)
  ) {
    scheduledEditorRenderMode = targetMode;
  }
  if (scheduledEditorRenderMode === "none") return;
  if (useDebounce) {
    if (scheduledEditorRenderFrame) {
      if (typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(scheduledEditorRenderFrame);
      } else {
        window.clearTimeout(scheduledEditorRenderFrame);
      }
      scheduledEditorRenderFrame = 0;
    }
    if (scheduledEditorRenderTimer) {
      window.clearTimeout(scheduledEditorRenderTimer);
    }
    scheduledEditorRenderTimer = window.setTimeout(function () {
      if (typeof window.requestAnimationFrame === "function") {
        scheduledEditorRenderFrame = window.requestAnimationFrame(
          flushScheduledEditorRender,
        );
        return;
      }
      scheduledEditorRenderFrame = window.setTimeout(
        flushScheduledEditorRender,
        16,
      );
    }, debounceMs);
    return;
  }
  if (scheduledEditorRenderTimer) {
    window.clearTimeout(scheduledEditorRenderTimer);
    scheduledEditorRenderTimer = 0;
  }
  if (scheduledEditorRenderFrame) return;
  if (typeof window.requestAnimationFrame === "function") {
    scheduledEditorRenderFrame = window.requestAnimationFrame(
      flushScheduledEditorRender,
    );
    return;
  }
  scheduledEditorRenderFrame = window.setTimeout(
    flushScheduledEditorRender,
    16,
  );
};

TPP.editorRenderActionForTarget = editorRenderActionForTarget;
TPP.scheduleEditorRender = scheduleEditorRender;
