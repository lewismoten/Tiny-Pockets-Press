document.addEventListener("DOMContentLoaded", async function () {
  TPP.populate();
  await TPP.load();
  TPP.view = TPP.initialView();
  if (!window.location.hash) history.replaceState(null, "", "#" + TPP.view);
  TPP.loadForm();
  TPP.restoreSettingsUi();
  TPP.switchView(TPP.view, true);
  TPP.bindSettingsUiPersistence();

  document.querySelectorAll(".tab").forEach(function (button) {
    button.onclick = function () { TPP.switchView(button.dataset.view); };
  });

  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = function () {
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize") document.querySelector(".customSize").hidden = document.getElementById("pageSize").value !== "custom";
      TPP.sync("draft");
      TPP.renderAll();
    };
    el.onchange = function () {
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize") document.querySelector(".customSize").hidden = document.getElementById("pageSize").value !== "custom";
      TPP.sync("commit");
      TPP.renderAll();
    };
  });

  document.getElementById("coverImage").onchange = function (e) { TPP.file(e, function (data) { TPP.active.coverImageData = data; TPP.save(); TPP.renderAll(); }); };
  document.getElementById("backImage").onchange = function (e) { TPP.file(e, function (data) { TPP.active.backImageData = data; TPP.save(); TPP.renderAll(); }); };
  document.getElementById("spineImage").onchange = function (e) { TPP.file(e, function (data) { TPP.active.spineImageData = data; TPP.save(); TPP.renderAll(); }); };

  document.getElementById("chapterList").onclick = function (e) {
    const row = e.target.closest("[data-i]");
    if (!row) return;
    TPP.sync();
    const index = Number(row.dataset.i);
    const action = e.target.dataset.act;
    if (action === "select") TPP.currentChapter = index;
    else if (action === "up" && index > 0) {
      [TPP.active.chapters[index - 1], TPP.active.chapters[index]] = [TPP.active.chapters[index], TPP.active.chapters[index - 1]];
      TPP.currentChapter = index - 1;
    } else if (action === "down" && index < TPP.active.chapters.length - 1) {
      [TPP.active.chapters[index + 1], TPP.active.chapters[index]] = [TPP.active.chapters[index], TPP.active.chapters[index + 1]];
      TPP.currentChapter = index + 1;
    } else if (action === "indent") {
      TPP.active.chapters[index].level = Math.min(6, (TPP.active.chapters[index].level || 0) + 1);
    } else if (action === "outdent") {
      TPP.active.chapters[index].level = Math.max(0, (TPP.active.chapters[index].level || 0) - 1);
    }
    TPP.save();
    TPP.renderAll();
  };

  document.getElementById("chapterEditor").oninput = function (e) {
    const card = e.target.closest(".chapter-card");
    if (!card) return;
    if (e.target.classList.contains("chapter-metadata") && e.target.checked) {
      const textarea = card.querySelector(".chapter-text");
      if (textarea && !textarea.value.trim()) textarea.value = '{\n  "type": "blank",\n  "pages": 12\n}';
    }
    TPP.sync("draft");
    const preview = card.querySelector(".md-preview");
    const textarea = card.querySelector(".chapter-text");
    if (preview && textarea) {
      preview.innerHTML = card.querySelector(".chapter-metadata").checked ? TPP.metadataPreview(textarea.value) : TPP.previewWithBreaks(textarea.value);
      TPP.renderQr(preview);
    }
    TPP.renderChapterList();
  };
  document.getElementById("chapterEditor").addEventListener("change", function (e) {
    if (e.target.classList.contains("chapter-image")) return;
    const card = e.target.closest(".chapter-card");
    if (!card) return;
    TPP.sync("commit");
    TPP.renderAll();
  });

  document.getElementById("chapterEditor").onclick = function (e) {
    const fmt = e.target.dataset.fmt;
    if (fmt) {
      const textarea = document.querySelector(".chapter-text");
      const map = {
        bold: ["**", "**"],
        italic: ["*", "*"],
        underline: ["<u>", "</u>"],
        strike: ["~~", "~~"],
        ul: ["- ", ""],
        h2: ["## ", ""],
        table: ["\n| A | B |\n|---|---|\n| 1 | 2 |\n", ""]
      };
      const pair = map[fmt];
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, start) + pair[0] + textarea.value.slice(start, end) + pair[1] + textarea.value.slice(end);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.focus();
    }
    const main = e.target.dataset.main;
    if (main === "remove" && TPP.active.chapters.length > 1) {
      TPP.sync();
      const card = e.target.closest(".chapter-card");
      const removeIndex = Math.max(0, Math.min(
        Number(card && card.dataset.index),
        TPP.active.chapters.length - 1
      ));
      TPP.active.chapters.splice(removeIndex, 1);
      TPP.currentChapter = Math.min(removeIndex, TPP.active.chapters.length - 1);
      TPP.save();
      TPP.renderAll();
    }
    if (main === "read") {
      const pages = TPP.buildPages();
      const title = TPP.active.chapters[TPP.currentChapter].title;
      TPP.readerIndex = Math.max(0, pages.findIndex(function (p) { return p.html.includes(TPP.esc(title)); }));
      TPP.switchView("reader");
    }
  };

  document.getElementById("chapterEditor").onchange = function (e) {
    if (e.target.classList.contains("chapter-image")) {
      TPP.file(e, function (data) {
        TPP.active.chapters[TPP.currentChapter].imageData = data;
        TPP.save();
        TPP.renderAll();
      });
    }
  };

  document.getElementById("addChapter").onclick = function () {
    TPP.sync();
    TPP.active.chapters.push({ id: TPP.uid(), title: "New Chapter", tocTitle: "", text: "", imageData: "", imagePlacement: "none", imageWidth: 70, level: 0, isSubsection: false, isMetadata: false, includeInToc: true });
    TPP.currentChapter = TPP.active.chapters.length - 1;
    TPP.save();
    TPP.renderAll();
  };

  document.getElementById("newBook").onclick = function () {
    const book = TPP.fallbackBook();
    book.title = "Untitled Tiny Book";
    book.chapters = [{ id: TPP.uid(), title: "New Chapter", tocTitle: "", text: "", imageData: "", imagePlacement: "none", imageWidth: 70, level: 0, isSubsection: false, isMetadata: false, includeInToc: true }];
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  document.getElementById("duplicateBook").onclick = function () {
    TPP.sync();
    const name = prompt("Title for duplicated book:", "Copy of " + TPP.active.title);
    if (name === null) return;
    const stamp = TPP.nowIso();
    const book = TPP.bookDescendant(TPP.active, {
      id: TPP.uid(),
      title: name || "Copy of " + TPP.active.title
    }, "copy", stamp);
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  document.getElementById("deleteBook").onclick = function () {
    if (TPP.library.length <= 1) return alert("Keep at least one book.");
    if (confirm("Delete this book?")) {
      TPP.library = TPP.library.filter(function (book) { return book.id !== TPP.active.id; });
      TPP.save();
      TPP.setActive(TPP.library[0]);
    }
  };

  TPP.readerGoPrev = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    TPP.readerIndex = TPP.readerNormalizeIndex(TPP.readerIndex - (mode === "spread" ? 2 : 1), pages, mode, settings);
    TPP.renderReader();
  };
  document.getElementById("readerStagePrev").onclick = TPP.readerGoPrev;
  TPP.readerGoNext = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    const next = mode === "spread" && TPP.readerIndex === 0 ? 1 : TPP.readerIndex + (mode === "spread" ? 2 : 1);
    TPP.readerIndex = TPP.readerNormalizeIndex(next, pages, mode, settings);
    TPP.renderReader();
  };
  document.getElementById("readerStageNext").onclick = TPP.readerGoNext;
  document.getElementById("readerJump").onchange = function () {
    TPP.readerIndex = Number(document.getElementById("readerJump").value);
    TPP.renderReader();
  };
  document.getElementById("readerScrub").oninput = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    TPP.readerIndex = TPP.readerNormalizeIndex(Number(document.getElementById("readerScrub").value), pages, mode, settings);
    TPP.renderReader();
  };
  document.getElementById("readerMode").onchange = TPP.renderReader;

  document.getElementById("librarySearch").oninput = TPP.renderLibrary;
  document.getElementById("libraryImport").onclick = function () {
    const input = document.getElementById("importJson");
    if (!input) return;
    input.value = "";
    input.click();
  };
  document.getElementById("libraryGrid").onclick = function (e) {
    const button = e.target.closest("[data-act]");
    const card = e.target.closest("[data-id]");
    if (!button || !card) return;
    const book = TPP.library.find(function (b) { return b.id === card.dataset.id; });
    if (button.dataset.act === "edit") { TPP.setActive(book); TPP.switchView("editor"); }
    if (button.dataset.act === "about") { TPP.setActive(book); TPP.switchView("about"); }
    if (button.dataset.act === "view") { TPP.setActive(book); TPP.switchView("reader"); }
    if (button.dataset.act === "dup") {
      const name = prompt("Title for duplicated book:", "Copy of " + book.title);
      if (name !== null) {
        const stamp = TPP.nowIso();
        const copy = TPP.bookDescendant(book, {
          id: TPP.uid(),
          title: name || "Copy of " + book.title
        }, "copy", stamp);
        TPP.library.push(copy);
        TPP.save();
        TPP.renderLibrary();
      }
    }
    if (button.dataset.act === "export") {
      TPP.markBookExported(book);
      TPP.save();
      TPP.download((book.title || "book") + ".json", book);
    }
  };

  document.getElementById("saveBook").onclick = async function () {
    TPP.sync();
    TPP.buildPages();
    await TPP.captureCover();
    TPP.toast("Saved.");
  };
  document.getElementById("exportInteriorPdf").onclick = function () { TPP.exportPdfFrom("interior"); };
  document.getElementById("exportReadablePdf").onclick = function () { TPP.exportReadablePdf(); };
  document.getElementById("exportImagesZip").onclick = function () { TPP.exportImagesZip(); };
  document.getElementById("exportCoverPdf").onclick = function () { TPP.exportPdfFrom("cover"); };
  document.getElementById("printBrowser").onclick = function () { setTimeout(function () { print(); }, 80); };
  document.getElementById("exportBook").onclick = function () {
    TPP.sync();
    TPP.markBookExported(TPP.active);
    TPP.save();
    TPP.download((TPP.active.title || "book") + ".json", TPP.active);
  };
  document.getElementById("exportStyle").onclick = function () {
    TPP.sync();
    const out = { type: "tiny-pockets-style-v6-1", style: {} };
    TPP.styleFields.forEach(function (field) { out.style[field] = TPP.active[field]; });
    TPP.download("tiny-pockets-style.json", out);
  };
  document.getElementById("exportLibrary").onclick = function () {
    const stamp = TPP.nowIso();
    TPP.library.forEach(function (book) { TPP.markBookExported(book, stamp); });
    TPP.save();
    TPP.download("tiny-pockets-library.json", { books: TPP.library });
  };
  document.getElementById("importJson").onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function () {
      const data = JSON.parse(reader.result);
      if (data.books) {
        const stamp = TPP.nowIso();
        for (const rawBook of data.books) {
          const incoming = TPP.bookImported(rawBook, stamp);
          const existingIndex = TPP.library.findIndex(function (book) { return book.id === incoming.id; });
          if (existingIndex < 0) {
            TPP.library.push(incoming);
            continue;
          }
          const existing = TPP.library[existingIndex];
          const action = await TPP.resolveImportConflict(incoming, existing);
          if (action === "merge") {
            TPP.library[existingIndex] = TPP.mergeImportedBook(existing, incoming, stamp);
          } else if (action === "overwrite") {
            incoming.lastExportedAt = existing.lastExportedAt || incoming.lastExportedAt || "";
            TPP.library[existingIndex] = incoming;
          } else if (action === "copy") {
            TPP.library.push(TPP.bookDescendant(incoming, { id: TPP.uid() }, "import", stamp));
          }
        }
        TPP.save();
        TPP.setActive(TPP.library[0]);
        TPP.switchView("library");
      } else if (data.style) {
        Object.entries(data.style).forEach(function (entry) { TPP.active[entry[0]] = entry[1]; });
        TPP.save();
        TPP.loadForm();
        TPP.renderAll();
      } else {
        const stamp = TPP.nowIso();
        const incoming = TPP.bookImported(data, stamp);
        const existingIndex = TPP.library.findIndex(function (book) { return book.id === incoming.id; });
        if (existingIndex < 0) {
          TPP.library.push(incoming);
          TPP.save();
          TPP.setActive(incoming);
        } else {
          const existing = TPP.library[existingIndex];
          const action = await TPP.resolveImportConflict(incoming, existing);
          if (action === "cancel") return;
          if (action === "merge") {
            TPP.library[existingIndex] = TPP.mergeImportedBook(existing, incoming, stamp);
          } else if (action === "overwrite") {
            incoming.lastExportedAt = existing.lastExportedAt || incoming.lastExportedAt || "";
            TPP.library[existingIndex] = incoming;
          } else if (action === "copy") {
            const copy = TPP.bookDescendant(incoming, { id: TPP.uid() }, "import", stamp);
            TPP.library.push(copy);
            TPP.save();
            TPP.setActive(copy);
            return;
          }
          TPP.save();
          TPP.setActive(TPP.library[existingIndex]);
        }
      }
    };
    reader.readAsText(file);
  };
});

TPP.importConflictStamp = function (book) {
  const date = new Date(book && book.updatedAt);
  if (Number.isNaN(date.getTime())) return book && book.updatedAt ? String(book.updatedAt) : "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};
TPP.importConflictPreview = function (book) {
  const cover = book && book.coverPreview
    ? '<img src="' + TPP.esc(book.coverPreview) + '" alt="' + TPP.esc((book && book.title) || "Book cover") + '" style="display:block;max-width:100%;height:auto;border-radius:14px;box-shadow:0 14px 30px rgb(0 0 0/.18)">'
    : '<div class="conflict-cover-fallback" style="background:linear-gradient(to bottom,' + TPP.esc((book && book.coverBg1) || "#7b1f2a") + "," + TPP.esc((book && book.coverBg2) || "#251d1d") + ')">' + TPP.esc((book && book.title) || "Untitled") + "</div>";
  return '<article class="conflict-book">' +
    '<h3>' + TPP.esc((book && book.title) || "Untitled") + "</h3>" +
    '<div class="conflict-cover">' + cover + "</div>" +
    '<div class="conflict-meta">' +
      '<div><strong>ID:</strong> ' + TPP.esc((book && book.id) || "—") + "</div>" +
      '<div><strong>Revision:</strong> ' + TPP.esc(String((book && book.revision) || 1)) + "." + TPP.esc(String((book && book.subrevision) || 0)) + "</div>" +
      '<div><strong>Modified:</strong> ' + TPP.esc(TPP.importConflictStamp(book)) + "</div>" +
    "</div>" +
  "</article>";
};
TPP.resolveImportConflict = function (incoming, existing) {
  const dialog = document.getElementById("importConflictDialog");
  const text = document.getElementById("importConflictText");
  const books = document.getElementById("importConflictBooks");
  if (!dialog || !text || !books || typeof dialog.showModal !== "function") return Promise.resolve("cancel");
  text.textContent = 'A book with id "' + ((incoming && incoming.id) || "") + '" already exists. Choose how to handle this import.';
  books.innerHTML =
    '<div><div class="about-meta-label">Current Library Book</div>' + TPP.importConflictPreview(existing) + "</div>" +
    '<div><div class="about-meta-label">Incoming Import</div>' + TPP.importConflictPreview(incoming) + "</div>";
  return new Promise(function (resolve) {
    const close = function (action) {
      dialog.close();
      resolve(action || "cancel");
    };
    const handlers = Array.from(dialog.querySelectorAll("[data-action]")).map(function (button) {
      const handler = function () { close(button.dataset.action); };
      button.addEventListener("click", handler, { once: true });
      return { button: button, handler: handler };
    });
    const cancelHandler = function () { close("cancel"); };
    dialog.addEventListener("cancel", cancelHandler, { once: true });
    dialog.addEventListener("close", function cleanup() {
      handlers.forEach(function (entry) {
        entry.button.removeEventListener("click", entry.handler);
      });
      dialog.removeEventListener("cancel", cancelHandler);
    }, { once: true });
    dialog.showModal();
  });
};

TPP.validViews = function () {
  return ["editor", "about", "interior", "cover", "reader", "library"];
};
TPP.toast = function (message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(TPP.toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  TPP.toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
};
TPP.initialView = function () {
  const hash = window.location.hash.replace(/^#/, "");
  const stored = TPP.readSettingsUi().view;
  if (TPP.validViews().includes(hash)) return hash;
  if (TPP.validViews().includes(stored)) return stored;
  return TPP.view || "editor";
};
TPP.readSettingsUi = function () {
  try {
    return JSON.parse(localStorage.getItem(TPP.UI) || "{}");
  } catch {
    return {};
  }
};
TPP.writeSettingsUi = function (state) {
  localStorage.setItem(TPP.UI, JSON.stringify(state || {}));
};
TPP.readerUiState = function () {
  const mode = document.getElementById("readerMode");
  return {
    mode: mode ? mode.value : "single",
    index: Math.max(0, Number(TPP.readerIndex) || 0)
  };
};
TPP.restoreReaderUi = function (state) {
  if (!TPP.active) return;
  const mode = document.getElementById("readerMode");
  const saved = state && state.readerByBook && state.readerByBook[TPP.active.id];
  if (mode && saved && ["single", "spread", "duplex"].includes(saved.mode)) {
    mode.value = saved.mode;
  }
  TPP.readerIndex = Math.max(0, Number(saved && saved.index) || 0);
};
TPP.settingsDetails = function () {
  return Array.from(document.querySelectorAll(".controls details"));
};
TPP.restoreSettingsUi = function () {
  const state = TPP.readSettingsUi();
  TPP.settingsDetails().forEach(function (details, index) {
    details.dataset.settingsIndex = index;
    if (state.open && Object.prototype.hasOwnProperty.call(state.open, index)) {
      details.open = Boolean(state.open[index]);
    }
  });
  const controls = document.querySelector(".controls");
  if (controls && Number.isFinite(Number(state.scrollTop))) {
    requestAnimationFrame(function () {
      controls.scrollTop = Number(state.scrollTop) || 0;
    });
  }
  TPP.restoreReaderUi(state);
};
TPP.saveSettingsUi = function () {
  const controls = document.querySelector(".controls");
  const open = {};
  const state = TPP.readSettingsUi();
  const readerByBook = Object.assign({}, state.readerByBook || {});
  TPP.settingsDetails().forEach(function (details, index) {
    open[index] = details.open;
  });
  if (TPP.active) readerByBook[TPP.active.id] = TPP.readerUiState();
  TPP.writeSettingsUi({
    readerByBook: readerByBook,
    open: open,
    scrollTop: controls ? controls.scrollTop : 0,
    view: TPP.view
  });
};
TPP.bindSettingsUiPersistence = function () {
  const controls = document.querySelector(".controls");
  let scrollTimer = 0;
  TPP.settingsDetails().forEach(function (details, index) {
    details.dataset.settingsIndex = index;
    details.addEventListener("toggle", TPP.saveSettingsUi);
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
  TPP.renderAll();
};
TPP.renderAll = function () {
  if (TPP.view === "editor") { TPP.renderChapterList(); TPP.renderChapterEditor(); }
  if (TPP.view === "about") TPP.renderAbout();
  if (TPP.view === "interior") TPP.renderInterior();
  if (TPP.view === "cover") TPP.renderCover();
  if (TPP.view === "reader") TPP.renderReader();
  if (TPP.view === "library") TPP.renderLibrary();
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
        back: sheet.back
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
TPP.readerGoToDuplexNeighbor = function (pages, settings, pageNumber, delta) {
  const nextPage = Math.max(1, Math.min(pages.length, Number(pageNumber || 0) + delta));
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerPageToDuplexSheet(pages, nextPage - 1, settings.signatureSize),
    pages,
    "duplex",
    settings
  );
  TPP.renderReader();
};
TPP.readerNav = function (pages, mode, settings) {
  const duplex = mode === "duplex";
  const options = ['<option value="0">' + (duplex ? "First Sheet" : "Front Cover") + "</option>"];
  const tocIndex = pages.findIndex(function (p) { return p.type === "toc"; });
  const tocValue = duplex ? TPP.readerPageToDuplexSheet(pages, tocIndex, settings.signatureSize) : tocIndex;
  if (tocIndex >= 0) options.push('<option value="' + tocValue + '">Table of Contents</option>');
  TPP.active.chapters.forEach(function (chapter) {
    const pageIndex = pages.findIndex(function (p) { return p.html.includes(TPP.esc(chapter.title || "")); });
    const index = duplex ? TPP.readerPageToDuplexSheet(pages, pageIndex, settings.signatureSize) : pageIndex;
    if (pageIndex >= 0) options.push('<option value="' + index + '">' + "— ".repeat(chapter.level || 0) + TPP.esc(chapter.title || "Untitled") + "</option>");
  });
  options.push('<option value="' + (duplex ? Math.max(0, TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1) : pages.length - 1) + '">' + (duplex ? "Last Sheet" : "Last Page") + "</option>");
  document.getElementById("readerJump").innerHTML = options.join("");
  document.getElementById("readerJump").value = TPP.readerIndex;
};
TPP.readerNormalizeIndex = function (index, pages, mode, settings) {
  const signatureSize = TPP.signatureSize(settings && settings.signatureSize);
  const last = mode === "duplex" ? Math.max(0, TPP.readerDuplexSheets(pages, signatureSize).length - 1) : Math.max(0, pages.length - 1);
  let next = Math.max(0, Math.min(Number(index) || 0, last));
  if (mode === "spread" && next > 0 && next % 2 === 0) next -= 1;
  return next;
};
TPP.readerProgressText = function (pages, index, mode, settings) {
  if (mode === "duplex") {
    const sheets = TPP.readerDuplexSheets(pages, settings.signatureSize);
    const sheet = TPP.readerDuplexSheetPages(pages, index, settings.signatureSize);
    if (!sheet) return "No interior sheets";
    return "Signature " + (sheet.signature + 1) + " • Sheet " + (sheet.sheet + 1) + " of " + sheets.length + " • " +
      sheet.front.pages[0] + ", " + sheet.front.pages[1] + " / " + sheet.back.pages[0] + ", " + sheet.back.pages[1];
  }
  const start = Math.min(pages.length, index + 1);
  if (mode !== "spread" || index === 0 || index >= pages.length - 1) return "Page " + start + " of " + pages.length;
  return "Pages " + start + "-" + Math.min(pages.length, index + 2) + " of " + pages.length;
};
TPP.syncReaderProgress = function (pages, index, mode, settings) {
  const scrub = document.getElementById("readerScrub");
  const label = document.getElementById("readerProgressLabel");
  const start = document.getElementById("readerProgressStart");
  const end = document.getElementById("readerProgressEnd");
  if (!scrub || !label || !start || !end) return;
  scrub.max = mode === "duplex" ? Math.max(0, TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1) : Math.max(0, pages.length - 1);
  scrub.value = index;
  const span = Number(scrub.max) || 0;
  const pct = span <= 0 ? 0 : (index / span) * 100;
  scrub.style.setProperty("--reader-progress", pct + "%");
  label.textContent = TPP.readerProgressText(pages, index, mode, settings);
  start.textContent = mode === "duplex" ? "Sheet 1" : "1";
  end.textContent = mode === "duplex" ? "Sheet " + (Number(scrub.max) + 1 || 1) : String(pages.length);
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
  const sheet = TPP.readerDuplexSheetPages(pages, sheetIndex, settings.signatureSize);
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
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[1])
    },
    {
      side: "right",
      title: "Leaf " + sheet.front.pages[1] + " / " + sheet.back.pages[0],
      front: TPP.readerPageOrBlank(pages, sheet.front.pages[1]),
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[0])
    }
  ];
  const readerWidth = settings.page.w * 2.45;
  const readerHeight = settings.page.h * 2.2;
  const scale = Math.min(4, Math.max(.75, Math.min((window.innerWidth - 560) / (readerWidth * 96), (window.innerHeight - 240) / (readerHeight * 96))));
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
      ["Back side", leaf.back, TPP.oppositePageSide(leaf.side), leaf.side === "left" ? -1 : 1]
    ].forEach(function (face) {
      const faceEl = document.createElement("div");
      faceEl.className = "duplex-face";
      const label = document.createElement("div");
      label.className = "duplex-face-label";
      label.textContent = face[0];
      faceEl.appendChild(label);
      const mini = TPP.readerMiniPage(face[1], settings, face[2]);
      mini.onclick = function () {
        TPP.readerGoToDuplexNeighbor(pages, settings, face[1] && face[1].n, face[3]);
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
  TPP.readerIndex = TPP.readerNormalizeIndex(TPP.readerIndex, pages, mode, settings);
  TPP.saveSettingsUi();
  TPP.readerNav(pages, mode, settings);
  TPP.syncReaderProgress(pages, TPP.readerIndex, mode, settings);
  if (mode === "duplex") {
    TPP.renderReaderDuplex(pages, settings, TPP.readerIndex);
    return;
  }
  const frontCover = pages[TPP.readerIndex] && pages[TPP.readerIndex].role === "front";
  const spineW = frontCover ? TPP.spineWidth(settings) : 0;
  const shown = mode === "spread" ? (frontCover ? [pages[TPP.readerIndex]] : [pages[TPP.readerIndex], pages[TPP.readerIndex + 1] || null]) : [pages[TPP.readerIndex]];
  const spread = document.createElement("div");
  spread.className = "spread";
  const readerWidth = frontCover ? settings.page.w + spineW : (mode === "spread" ? settings.page.w * 2.25 : settings.page.w);
  const scale = Math.min(5, Math.max(1.2, (window.innerWidth - 560) / (readerWidth * 96)));
  spread.style.transform = "scale(" + scale + ")";
  shown.forEach(function (page, shownIndex) {
    const shell = document.createElement("div");
    shell.className = "reader-shell";
    const withSpine = page && page.role === "front" && spineW > 0;
    shell.style.width = (settings.page.w + (withSpine ? spineW : 0)) + "in";
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
