window.TPP = window.TPP || {};

TPP.bindTopLevelEventRouters = function () {
  if (TPP.topLevelEventRoutersBound) return;
  TPP.topLevelEventRoutersBound = true;

  document.addEventListener("click", async function (event) {
    const target = event.target;
    if (!target.closest(".tab") && !target.closest("#toggleBookButtonText")) {
      return;
    }
    const api = await TPP.ensureControlModule("app-view-controls");
    if (api && typeof api.handleClick === "function") {
      api.handleClick(event);
    }
  });

  document.addEventListener("click", async function (event) {
    const target = event.target;
    if (
      target.closest("#coverImageSlot .asset-picker-open") ||
      target.closest("#backImageSlot .asset-picker-open") ||
      target.closest("#spineImageSlot .asset-picker-open")
    ) {
      const api = await TPP.ensureControlModule("editor-asset-slot-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (target.closest("#chapterList [data-i]")) {
      const api = await TPP.ensureControlModule("editor-chapter-list-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (target.closest("#chapterEditor") || target.closest("#addChapter")) {
      const api = await TPP.ensureControlModule(
        "editor-chapter-editor-controls",
      );
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (
      target.closest("#readerStagePrev") ||
      target.closest("#readerStageNext")
    ) {
      const api = await TPP.ensureControlModule("reader-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (
      target.closest("#libraryNewBook") ||
      target.closest("#aboutDuplicateBook") ||
      target.closest("#aboutDeleteBook") ||
      target.closest("#libraryUploadBook") ||
      target.closest("#libraryGrid [data-id]")
    ) {
      const api = await TPP.ensureControlModule("library-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (target.closest("#saveBook")) {
      const api = await TPP.ensureControlModule("book-save-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (
      target.closest("#exportInteriorPdf") ||
      target.closest("#exportReadablePdf") ||
      target.closest("#exportImagesZip") ||
      target.closest("#exportCoverPdf") ||
      target.closest("#printBrowser")
    ) {
      const api = await TPP.ensureControlModule("book-export-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
      return;
    }
    if (
      target.closest("#aboutDownloadBook") ||
      target.closest("#libraryDownloadLibrary")
    ) {
      const api = await TPP.ensureControlModule("book-download-controls");
      if (api && typeof api.handleClick === "function") api.handleClick(event);
    }
  });

  document.addEventListener("input", async function (event) {
    const target = event.target;
    if (target.closest("#chapterEditor")) {
      const api = await TPP.ensureControlModule(
        "editor-chapter-editor-controls",
      );
      if (api && typeof api.handleInput === "function") api.handleInput(event);
      return;
    }
    if (target.closest("#readerScrub")) {
      const api = await TPP.ensureControlModule("reader-controls");
      if (api && typeof api.handleInput === "function") api.handleInput(event);
      return;
    }
    if (target.closest("#librarySearch")) {
      const api = await TPP.ensureControlModule("library-controls");
      if (api && typeof api.handleInput === "function") api.handleInput(event);
    }
  });

  document.addEventListener("change", async function (event) {
    const target = event.target;
    if (target.closest("#chapterEditor")) {
      const api = await TPP.ensureControlModule(
        "editor-chapter-editor-controls",
      );
      if (api && typeof api.handleChange === "function")
        api.handleChange(event);
      return;
    }
    if (target.closest("#readerJump") || target.closest("#readerMode")) {
      const api = await TPP.ensureControlModule("reader-controls");
      if (api && typeof api.handleChange === "function")
        api.handleChange(event);
    }
  });
};

TPP.bootstrapApp = async function () {
  if (TPP.appBootstrapped) return;
  TPP.appBootstrapped = true;

  if (typeof TPP.initializeRuntimeUi === "function") {
    TPP.initializeRuntimeUi();
  }
  TPP.populate();
  await TPP.load();
  await TPP.loadStaleKeyLookup();
  await TPP.ensureControlModule("settings-ui-controls");
  TPP.bindTopLevelEventRouters();
  TPP.view = TPP.initialView();
  if (!window.location.hash) history.replaceState(null, "", "#" + TPP.view);
  TPP.loadForm();
  TPP.restoreSettingsUi();
  TPP.switchView(TPP.view, true);
  TPP.bindSettingsUiPersistence();
};

document.addEventListener("DOMContentLoaded", function () {
  TPP.bootstrapApp();
});
