let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  let scrollTimer = 0;
  let bound = false;

  TPP.settingsDetails = function () {
    return Array.from(document.querySelectorAll(".controls details"));
  };
  TPP.enforceSingleOpenSettingsSection = function (activeDetails) {
    if (!activeDetails || !activeDetails.open) return;
    TPP.settingsDetails().forEach(function (details) {
      if (details !== activeDetails) details.open = false;
    });
  };
  TPP.setBookButtonTextVisibility = function (showText) {
    const show = showText !== false;
    document.body.classList.toggle("book-icons-only", !show);
    const toggle = document.getElementById("toggleBookButtonText");
    if (!toggle) return;
    const label = toggle.querySelector(".book-toolbar-label");
    if (label) label.textContent = show ? "Hide Labels" : "Show Labels";
    toggle.setAttribute("aria-pressed", show ? "false" : "true");
  };
  TPP.restoreSettingsUi = function () {
    const state = TPP.readSettingsUi();
    let lastOpen = null;
    TPP.settingsDetails().forEach(function (details, index) {
      details.dataset.settingsIndex = index;
      if (
        state.open &&
        Object.prototype.hasOwnProperty.call(state.open, index)
      ) {
        details.open = Boolean(state.open[index]);
        if (details.open) lastOpen = details;
      }
    });
    if (lastOpen) TPP.enforceSingleOpenSettingsSection(lastOpen);
    const controls = document.querySelector(".controls");
    if (controls && Number.isFinite(Number(state.scrollTop))) {
      requestAnimationFrame(function () {
        controls.scrollTop = Number(state.scrollTop) || 0;
      });
    }
    TPP.setBookButtonTextVisibility(state.showBookButtonText !== false);
    TPP.restoreReaderUi(state);
  };
  TPP.saveSettingsUi = function () {
    const controls = document.querySelector(".controls");
    const open = {};
    const state = TPP.readSettingsUi();
    const readerByBook = Object.assign({}, state.readerByBook || {});
    const dataTabByBook = Object.assign({}, state.dataTabByBook || {});
    TPP.settingsDetails().forEach(function (details, index) {
      open[index] = details.open;
    });
    if (TPP.active) readerByBook[TPP.bookId(TPP.active)] = TPP.readerUiState();
    TPP.writeSettingsUi({
      classificationProfileId: String(state.classificationProfileId || "home"),
      dataTabByBook: dataTabByBook,
      imageExport: state.imageExport || { dpi: 300 },
      showBookButtonText: state.showBookButtonText !== false,
      readerByBook: readerByBook,
      open: open,
      scrollTop: controls ? controls.scrollTop : 0,
      view: TPP.view,
    });
  };
  TPP.bindSettingsUiPersistence = function () {
    if (bound) return;
    bound = true;
    const controls = document.querySelector(".controls");
    TPP.settingsDetails().forEach(function (details, index) {
      details.dataset.settingsIndex = index;
      details.addEventListener("toggle", function () {
        if (details.open) TPP.enforceSingleOpenSettingsSection(details);
        TPP.saveSettingsUi();
      });
    });
    if (controls) {
      controls.addEventListener("scroll", function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(TPP.saveSettingsUi, 120);
      });
    }
    window.addEventListener("beforeunload", TPP.saveSettingsUi);
    window.addEventListener("hashchange", function () {
      const view = TPP.initialView();
      if (view !== TPP.view) TPP.switchView(view, true);
    });
  };

  return {};
}
