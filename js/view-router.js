window.TPP = window.TPP || {};
TPP.UI = TPP.UI || {};
TPP.UI.Views = TPP.UI.Views || {};

TPP.validViews = function () {
  return [
    "editor",
    "about",
    "software",
    "data",
    "interior",
    "cover",
    "reader",
    "library",
  ];
};

TPP.initialView = function () {
  const hash = window.location.hash.replace(/^#/, "");
  const stored = TPP.readSettingsUi().view;
  if (TPP.validViews().includes(hash)) return hash;
  if (TPP.validViews().includes(stored)) return stored;
  return TPP.view || "editor";
};

TPP.renderSidebarMode = function () {
  const body = document.body;
  const appShell = document.querySelector(".app-shell");
  const controls = document.querySelector(".controls");
  const settings = document.querySelector(".settings");
  const dataSidebar = document.getElementById("dataSidebar");
  const chapterSidebar = document.getElementById("chapterSidebarMount");
  const bookChromeBar = document.getElementById("bookChromeBar");
  const bookActionsBar = document.getElementById("bookActionsBar");
  const bookTabsBar = document.getElementById("bookTabsBar");
  const editorMode = TPP.view === "editor";
  const dataMode = TPP.view === "data";
  const softwareMode = TPP.view === "software";
  const libraryMode = TPP.view === "library";
  const hideBookChrome = softwareMode || libraryMode;
  if (body) body.classList.toggle("book-chrome-hidden", hideBookChrome);
  if (appShell) appShell.classList.toggle("no-sidebar", hideBookChrome);
  if (settings) settings.hidden = hideBookChrome;
  if (controls)
    controls.hidden = editorMode || dataMode || softwareMode || libraryMode;
  if (chapterSidebar) chapterSidebar.hidden = !editorMode;
  if (dataSidebar) dataSidebar.hidden = !dataMode;
  if (bookChromeBar) bookChromeBar.hidden = hideBookChrome;
  if (bookTabsBar) bookTabsBar.hidden = hideBookChrome;
  if (bookActionsBar) bookActionsBar.hidden = hideBookChrome;
};

TPP.switchView = function (view, fromHash) {
  if (!TPP.validViews().includes(view)) view = "editor";
  TPP.view = view;
  if (!fromHash && window.location.hash !== "#" + view) {
    history.replaceState(null, "", "#" + view);
  }
  TPP.saveSettingsUi();
  document.querySelectorAll(".tab").forEach(function (button) {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach(function (element) {
    element.classList.remove("active");
  });
  document.getElementById(view + "View").classList.add("active");
  TPP.renderSidebarMode();
  TPP.renderAll();
};

TPP.renderAll = function () {
  TPP.renderSidebarMode();
  if (TPP.renderChapterSidebar) TPP.renderChapterSidebar();
  if (TPP.view === "editor") {
    if (TPP.renderTextElementControls) TPP.renderTextElementControls();
    TPP.renderChapterList();
    TPP.renderChapterEditor();
  }
  if (TPP.view === "about") TPP.renderAbout();
  if (TPP.view === "software") TPP.renderSoftwareAbout();
  if (TPP.view === "data") TPP.renderData();
  if (TPP.view === "interior") TPP.renderInterior();
  if (TPP.view === "cover") TPP.renderCover();
  if (TPP.view === "reader") TPP.renderReader();
  if (TPP.view === "library") TPP.renderLibrary();
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
};

Object.assign(TPP.UI.Views, {
  valid: TPP.validViews,
  initial: TPP.initialView,
  renderSidebarMode: TPP.renderSidebarMode,
  switchView: TPP.switchView,
  renderAll: TPP.renderAll,
});
