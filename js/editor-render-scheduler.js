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

TPP.patchCoverPreviewSurface = function (location) {
  const side = location === "back" ? "back" : "front";
  const preview = document.getElementById("coverPreview");
  if (!preview || !TPP.active || TPP.view !== "cover") return false;
  if (location === "spine") {
    const settings = TPP.settings();
    const spineW = TPP.spineWidth(settings);
    if (!(spineW > 0) || !TPP.spineEl) return false;
    const spineNodes = Array.from(preview.querySelectorAll(".spine-piece"));
    if (!spineNodes.length) return false;
    spineNodes.forEach(function (node) {
      node.replaceWith(
        TPP.spineEl(
          settings,
          TPP.coverWrap(settings) + settings.page.w + spineW / 2,
          TPP.coverWrap(settings),
          settings.page.h,
        ),
      );
    });
    return true;
  }
  const selector = side === "back" ? ".page.back" : ".page.cover";
  const pageNodes = Array.from(preview.querySelectorAll(selector));
  if (!pageNodes.length || !TPP.coverHTML) return false;
  pageNodes.forEach(function (pageNode) {
    const inner = pageNode.querySelector(".page-inner");
    if (inner) inner.innerHTML = TPP.coverHTML(TPP.active, side);
  });
  return pageNodes.some(function (pageNode) {
    return !!pageNode.querySelector(".page-inner");
  });
};

TPP.patchReaderPreviewSurface = function (location) {
  const role = location === "back" ? "back" : "front";
  const preview = document.getElementById("readerPreview");
  if (
    !preview ||
    !TPP.active ||
    TPP.view !== "reader" ||
    !Array.isArray(TPP.readerVisiblePageRoles) ||
    !TPP.readerVisiblePageRoles.includes(location === "spine" ? "front" : role)
  ) {
    return false;
  }
  if (location === "spine") {
    const settings = TPP.settings();
    const spineW = TPP.spineWidth(settings);
    if (!(spineW > 0) || !TPP.spineEl) return false;
    const spineNodes = Array.from(preview.querySelectorAll(".spine-piece"));
    if (!spineNodes.length) return false;
    spineNodes.forEach(function (node) {
      node.replaceWith(TPP.spineEl(settings, spineW / 2, 0, settings.page.h));
    });
    return true;
  }
  if (!TPP.coverHTML) return false;
  const selector =
    role === "back"
      ? '.page[data-page-role="back"]'
      : '.page[data-page-role="front"]';
  const pageNodes = Array.from(preview.querySelectorAll(selector));
  if (!pageNodes.length) return false;
  pageNodes.forEach(function (pageNode) {
    const inner = pageNode.querySelector(".page-inner");
    if (inner) inner.innerHTML = TPP.coverHTML(TPP.active, location);
  });
  return true;
};

TPP.patchVisibleCoverTextPreview = function (location) {
  if (location !== "front" && location !== "back" && location !== "spine") {
    return false;
  }
  if (TPP.view === "cover") return TPP.patchCoverPreviewSurface(location);
  if (TPP.view === "reader") return TPP.patchReaderPreviewSurface(location);
  return false;
};

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
