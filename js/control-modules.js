window.TPP = window.TPP || {};

TPP.controlModuleRegistry = {
  "asset-dialog": "controls/asset-dialog/",
  "cover-text-field-dialog": "controls/cover-text-field-dialog/",
  "book-info-picker-dialog": "controls/book-info-picker-dialog/",
  "custom-text-dialog": "controls/custom-text-dialog/",
  "import-conflict-dialog": "controls/import-conflict-dialog/",
  "library-upload-dialog": "controls/library-upload-dialog/",
  "data-image-dialog": "controls/data-image-dialog/",
  "data-text-dialog": "controls/data-text-dialog/",
  "color-picker-popover": "controls/color-picker-popover/",
  toast: "controls/toast/",
  "classification-dialog": "controls/classification-dialog/",
  "image-export-dialog": "controls/image-export-dialog/",
  "image-export-palette-dialog": "controls/image-export-palette-dialog/",
  "about-panel": "controls/about-panel/",
  "data-panel": "controls/data-panel/",
  "app-view-controls": "controls/app-view-controls/",
  "editor-range-controls": "controls/editor-range-controls/",
  "editor-book-info-controls": "controls/editor-book-info-controls/",
  "editor-cover-text-controls": "controls/editor-cover-text-controls/",
  "editor-copyright-controls": "controls/editor-copyright-controls/",
  "editor-asset-slot-controls": "controls/editor-asset-slot-controls/",
  "editor-chapter-list-controls": "controls/editor-chapter-list-controls/",
  "editor-chapter-editor-controls": "controls/editor-chapter-editor-controls/",
  "reader-controls": "controls/reader-controls/",
  "library-controls": "controls/library-controls/",
  "editor-drag-controls": "controls/editor-drag-controls/",
  "settings-ui-controls": "controls/settings-ui-controls/",
  "book-save-controls": "controls/book-save-controls/",
  "book-export-controls": "controls/book-export-controls/",
  "book-download-controls": "controls/book-download-controls/",
};
TPP.controlModuleState = TPP.controlModuleState || {};
TPP.ensureControlModule = async function (id) {
  const moduleId = String(id || "").trim();
  const basePath = TPP.controlModuleRegistry[moduleId];
  if (!basePath) throw new Error("Unknown control module: " + moduleId);
  const state =
    TPP.controlModuleState[moduleId] || (TPP.controlModuleState[moduleId] = {});
  if (state.api) return state.api;
  if (state.promise) return state.promise;
  state.promise = (async function () {
    const manifestUrl = new URL(
      basePath + moduleId + ".json",
      window.location.href,
    );
    const manifestResponse = await fetch(manifestUrl.href);
    if (!manifestResponse.ok) {
      throw new Error(
        "Unable to load control module manifest: " + manifestUrl.href,
      );
    }
    const manifest = await manifestResponse.json();
    manifest.id = manifest.id || moduleId;
    manifest.basePath = manifestUrl.href.replace(/[^/]+(?:\?.*)?$/, "");
    if (manifest.css) {
      const href = new URL(manifest.css, manifest.basePath).href;
      const linkId = "control-module-css-" + manifest.id;
      if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    }
    const rootIds = Array.isArray(manifest.rootIds) ? manifest.rootIds : [];
    const needsMarkup =
      !rootIds.length ||
      rootIds.some(function (rootId) {
        return !document.getElementById(rootId);
      });
    if (manifest.html && needsMarkup) {
      const htmlUrl = new URL(manifest.html, manifest.basePath);
      const htmlResponse = await fetch(htmlUrl.href);
      if (!htmlResponse.ok) {
        throw new Error(
          "Unable to load control module markup: " + htmlUrl.href,
        );
      }
      document.body.insertAdjacentHTML("beforeend", await htmlResponse.text());
    }
    let api = {};
    if (manifest.js) {
      const moduleUrl = new URL(manifest.js, manifest.basePath);
      const moduleExports = await import(moduleUrl.href);
      api =
        moduleExports && typeof moduleExports.init === "function"
          ? await moduleExports.init(TPP, manifest)
          : {};
    }
    state.api = api || {};
    state.manifest = manifest;
    return state.api;
  })();
  return state.promise;
};
TPP.openAssetDialog = async function (targetType, targetKey) {
  const api = await TPP.ensureControlModule("asset-dialog");
  if (api && typeof api.open === "function") {
    return api.open(targetType, targetKey);
  }
};
TPP.closeAssetDialog = async function () {
  const api = await TPP.ensureControlModule("asset-dialog");
  if (api && typeof api.close === "function") return api.close();
};
TPP.renderAssetDialog = async function () {
  const api = await TPP.ensureControlModule("asset-dialog");
  if (api && typeof api.render === "function") return api.render();
};
TPP.openFrontCoverFieldDialog = async function (location) {
  const api = await TPP.ensureControlModule("cover-text-field-dialog");
  if (api && typeof api.open === "function") return api.open(location);
};
TPP.openBookInfoPickerDialog = async function (kind, entryId) {
  const api = await TPP.ensureControlModule("book-info-picker-dialog");
  if (api && typeof api.open === "function") return api.open(kind, entryId);
};
TPP.openCustomTextDialog = async function (group) {
  const api = await TPP.ensureControlModule("custom-text-dialog");
  if (api && typeof api.open === "function") return api.open(group);
};
TPP.resolveImportConflict = async function (incoming, existing) {
  const api = await TPP.ensureControlModule("import-conflict-dialog");
  if (api && typeof api.resolve === "function") {
    return api.resolve(incoming, existing);
  }
  return "cancel";
};
TPP.openLibraryUploadDialog = async function () {
  const api = await TPP.ensureControlModule("library-upload-dialog");
  if (api && typeof api.open === "function") return api.open();
};
TPP.openDataImagePreview = async function (src, title) {
  const api = await TPP.ensureControlModule("data-image-dialog");
  if (api && typeof api.open === "function") return api.open(src, title);
};
TPP.openDataTextPreview = async function (title, body, mode) {
  const api = await TPP.ensureControlModule("data-text-dialog");
  if (api && typeof api.open === "function") return api.open(title, body, mode);
};
