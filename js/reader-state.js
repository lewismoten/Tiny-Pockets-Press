window.TPP = window.TPP || {};

TPP.readerVisiblePageRoles = [];

TPP.readerCurrentMode = function () {
  const mode = document.getElementById("readerMode");
  return mode ? mode.value : "single";
};

TPP.readerUiState = function () {
  return {
    mode: TPP.readerCurrentMode(),
    index: Math.max(0, Number(TPP.readerIndex) || 0),
  };
};

TPP.restoreReaderUi = function (state) {
  if (!TPP.active) return;
  const mode = document.getElementById("readerMode");
  const saved =
    state && state.readerByBook && state.readerByBook[TPP.bookId(TPP.active)];
  if (mode && saved && ["single", "spread", "duplex"].includes(saved.mode)) {
    mode.value = saved.mode;
  }
  TPP.readerIndex = Math.max(0, Number(saved && saved.index) || 0);
};

TPP.readerDuplexSheets = function (pages, signatureSize) {
  return TPP.signaturePlan(pages, signatureSize).flatMap(function (signature) {
    return signature.sheets.map(function (sheet) {
      return {
        signature: signature.index,
        signatureStart: signature.startPage,
        signatureEnd: signature.endPage,
        sheet: sheet.index,
        front: sheet.front,
        back: sheet.back,
      };
    });
  });
};

TPP.readerDuplexSheetPages = function (pages, sheetIndex, signatureSize) {
  const sheets = TPP.readerDuplexSheets(pages, signatureSize);
  return sheets[Math.max(0, Math.min(sheetIndex, sheets.length - 1))] || null;
};

TPP.readerPageToDuplexSheet = function (pages, pageIndex, signatureSize) {
  const target = Math.max(1, pageIndex + 1);
  const sheets = TPP.readerDuplexSheets(pages, signatureSize);
  const match = sheets.findIndex(function (sheet) {
    return sheet.front.pages.concat(sheet.back.pages).includes(target);
  });
  return match >= 0 ? match : 0;
};

TPP.readerNormalizeIndex = function (index, pages, mode, settings) {
  const signatureSize = TPP.signatureSize(settings && settings.signatureSize);
  const last =
    mode === "duplex"
      ? Math.max(0, TPP.readerDuplexSheets(pages, signatureSize).length - 1)
      : Math.max(0, pages.length - 1);
  let next = Math.max(0, Math.min(Number(index) || 0, last));
  if (mode === "spread" && next > 0 && next % 2 === 0) next -= 1;
  return next;
};

TPP.readerProgressText = function (pages, index, mode, settings) {
  if (mode === "duplex") {
    const sheets = TPP.readerDuplexSheets(pages, settings.signatureSize);
    const sheet = TPP.readerDuplexSheetPages(
      pages,
      index,
      settings.signatureSize,
    );
    if (!sheet) return "No interior sheets";
    return (
      "Signature " +
      (sheet.signature + 1) +
      " • Sheet " +
      (sheet.sheet + 1) +
      " of " +
      sheets.length +
      " • " +
      sheet.front.pages[0] +
      ", " +
      sheet.front.pages[1] +
      " / " +
      sheet.back.pages[0] +
      ", " +
      sheet.back.pages[1]
    );
  }
  const start = Math.min(pages.length, index + 1);
  if (mode !== "spread" || index === 0 || index >= pages.length - 1) {
    return "Page " + start + " of " + pages.length;
  }
  return (
    "Pages " +
    start +
    "-" +
    Math.min(pages.length, index + 2) +
    " of " +
    pages.length
  );
};

TPP.syncReaderProgress = function (pages, index, mode, settings) {
  const scrub = document.getElementById("readerScrub");
  const label = document.getElementById("readerProgressLabel");
  const start = document.getElementById("readerProgressStart");
  const end = document.getElementById("readerProgressEnd");
  if (!scrub || !label || !start || !end) return;
  scrub.max =
    mode === "duplex"
      ? Math.max(
          0,
          TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1,
        )
      : Math.max(0, pages.length - 1);
  scrub.value = index;
  const span = Number(scrub.max) || 0;
  const pct = span <= 0 ? 0 : (index / span) * 100;
  scrub.style.setProperty("--reader-progress", pct + "%");
  label.textContent = TPP.readerProgressText(pages, index, mode, settings);
  start.textContent = mode === "duplex" ? "Sheet 1" : "1";
  end.textContent =
    mode === "duplex"
      ? "Sheet " + (Number(scrub.max) + 1 || 1)
      : String(pages.length);
};

TPP.readerNav = function (pages, mode, settings) {
  const duplex = mode === "duplex";
  const options = [
    '<option value="0">' +
      (duplex ? "First Sheet" : "Front Cover") +
      "</option>",
  ];
  const tocIndex = pages.findIndex(function (p) {
    return p.type === "toc";
  });
  const tocValue = duplex
    ? TPP.readerPageToDuplexSheet(pages, tocIndex, settings.signatureSize)
    : tocIndex;
  if (tocIndex >= 0) {
    options.push('<option value="' + tocValue + '">Table of Contents</option>');
  }
  TPP.active.chapters.forEach(function (chapter) {
    const pageIndex = pages.findIndex(function (p) {
      return p.html.includes(TPP.esc(chapter.title || ""));
    });
    const index = duplex
      ? TPP.readerPageToDuplexSheet(pages, pageIndex, settings.signatureSize)
      : pageIndex;
    if (pageIndex >= 0) {
      options.push(
        '<option value="' +
          index +
          '">' +
          "— ".repeat(chapter.level || 0) +
          TPP.esc(chapter.title || "Untitled") +
          "</option>",
      );
    }
  });
  options.push(
    '<option value="' +
      (duplex
        ? Math.max(
            0,
            TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1,
          )
        : pages.length - 1) +
      '">' +
      (duplex ? "Last Sheet" : "Last Page") +
      "</option>",
  );
  document.getElementById("readerJump").innerHTML = options.join("");
  document.getElementById("readerJump").value = TPP.readerIndex;
};

TPP.readerGoToDuplexNeighbor = function (pages, settings, pageNumber, delta) {
  const nextPage = Math.max(
    1,
    Math.min(pages.length, Number(pageNumber || 0) + delta),
  );
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerPageToDuplexSheet(pages, nextPage - 1, settings.signatureSize),
    pages,
    "duplex",
    settings,
  );
  TPP.renderReader();
};

TPP.readerGoPrevImpl = function () {
  const pages = TPP.buildPages();
  const mode = TPP.readerCurrentMode();
  const settings = TPP.settings();
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerIndex - (mode === "spread" ? 2 : 1),
    pages,
    mode,
    settings,
  );
  TPP.renderReader();
};

TPP.readerGoNextImpl = function () {
  const pages = TPP.buildPages();
  const mode = TPP.readerCurrentMode();
  const settings = TPP.settings();
  const next =
    mode === "spread" && TPP.readerIndex === 0
      ? 1
      : TPP.readerIndex + (mode === "spread" ? 2 : 1);
  TPP.readerIndex = TPP.readerNormalizeIndex(next, pages, mode, settings);
  TPP.renderReader();
};
