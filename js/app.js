document.addEventListener("DOMContentLoaded", async function () {
  TPP.populate();
  await TPP.load();
  TPP.view = TPP.initialView();
  if (!window.location.hash) history.replaceState(null, "", "#" + TPP.view);
  TPP.loadForm();
  TPP.switchView(TPP.view, true);
  TPP.restoreSettingsUi();
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
      TPP.sync();
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
    TPP.sync();
    const preview = card.querySelector(".md-preview");
    const textarea = card.querySelector(".chapter-text");
    if (preview && textarea) {
      preview.innerHTML = card.querySelector(".chapter-metadata").checked ? TPP.metadataPreview(textarea.value) : TPP.previewWithBreaks(textarea.value);
      TPP.renderQr(preview);
    }
    TPP.renderChapterList();
  };

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
      TPP.active.chapters.splice(TPP.currentChapter, 1);
      TPP.currentChapter = Math.max(0, TPP.currentChapter - 1);
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
    TPP.active.chapters.push({ id: TPP.uid(), title: "New Chapter", text: "", imageData: "", imagePlacement: "none", imageWidth: 70, level: 0, isSubsection: false, isMetadata: false, includeInToc: true });
    TPP.currentChapter = TPP.active.chapters.length - 1;
    TPP.save();
    TPP.renderAll();
  };

  document.getElementById("newBook").onclick = function () {
    const book = TPP.fallbackBook();
    book.title = "Untitled Tiny Book";
    book.chapters = [{ id: TPP.uid(), title: "New Chapter", text: "", imageData: "", imagePlacement: "none", imageWidth: 70, level: 0, isSubsection: false, isMetadata: false, includeInToc: true }];
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  document.getElementById("duplicateBook").onclick = function () {
    TPP.sync();
    const name = prompt("Title for duplicated book:", "Copy of " + TPP.active.title);
    if (name === null) return;
    const book = TPP.norm(Object.assign({}, TPP.clone(TPP.active), { id: TPP.uid(), title: name || "Copy of " + TPP.active.title }));
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

  document.getElementById("readerPrev").onclick = function () {
    TPP.readerIndex = Math.max(0, TPP.readerIndex - (document.getElementById("readerMode").value === "spread" ? 2 : 1));
    TPP.renderReader();
  };
  document.getElementById("readerNext").onclick = function () {
    TPP.readerIndex = document.getElementById("readerMode").value === "spread" && TPP.readerIndex === 0 ? 1 : TPP.readerIndex + (document.getElementById("readerMode").value === "spread" ? 2 : 1);
    TPP.renderReader();
  };
  document.getElementById("readerJump").onchange = function () {
    TPP.readerIndex = Number(document.getElementById("readerJump").value);
    TPP.renderReader();
  };
  document.getElementById("readerMode").onchange = TPP.renderReader;

  document.getElementById("librarySearch").oninput = TPP.renderLibrary;
  document.getElementById("libraryGrid").onclick = function (e) {
    const button = e.target.closest("[data-act]");
    const card = e.target.closest("[data-id]");
    if (!button || !card) return;
    const book = TPP.library.find(function (b) { return b.id === card.dataset.id; });
    if (button.dataset.act === "edit") { TPP.setActive(book); TPP.switchView("editor"); }
    if (button.dataset.act === "view") { TPP.setActive(book); TPP.switchView("reader"); }
    if (button.dataset.act === "dup") {
      const name = prompt("Title for duplicated book:", "Copy of " + book.title);
      if (name !== null) {
        const copy = TPP.norm(Object.assign({}, TPP.clone(book), { id: TPP.uid(), title: name || "Copy of " + book.title }));
        TPP.library.push(copy);
        TPP.save();
        TPP.renderLibrary();
      }
    }
    if (button.dataset.act === "export") TPP.download((book.title || "book") + ".json", book);
  };

  document.getElementById("saveBook").onclick = async function () {
    TPP.sync();
    TPP.buildPages();
    await TPP.captureCover();
    TPP.toast("Saved.");
  };
  document.getElementById("exportInteriorPdf").onclick = function () { TPP.exportPdfFrom("interior"); };
  document.getElementById("exportCoverPdf").onclick = function () { TPP.exportPdfFrom("cover"); };
  document.getElementById("printBrowser").onclick = function () { setTimeout(function () { print(); }, 80); };
  document.getElementById("exportBook").onclick = function () { TPP.sync(); TPP.download((TPP.active.title || "book") + ".json", TPP.active); };
  document.getElementById("exportStyle").onclick = function () {
    TPP.sync();
    const out = { type: "tiny-pockets-style-v6-1", style: {} };
    TPP.styleFields.forEach(function (field) { out.style[field] = TPP.active[field]; });
    TPP.download("tiny-pockets-style.json", out);
  };
  document.getElementById("exportLibrary").onclick = function () { TPP.download("tiny-pockets-library.json", { books: TPP.library }); };
  document.getElementById("importJson").onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const data = JSON.parse(reader.result);
      if (data.books) {
        TPP.library = data.books.map(TPP.norm);
        TPP.save();
        TPP.setActive(TPP.library[0]);
        TPP.switchView("library");
      } else if (data.style) {
        Object.entries(data.style).forEach(function (entry) { TPP.active[entry[0]] = entry[1]; });
        TPP.save();
        TPP.loadForm();
        TPP.renderAll();
      } else {
        const book = TPP.norm(data);
        book.id = TPP.uid();
        TPP.library.push(book);
        TPP.save();
        TPP.setActive(book);
      }
    };
    reader.readAsText(file);
  };
});

TPP.validViews = function () {
  return ["editor", "interior", "cover", "reader", "library"];
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
};
TPP.saveSettingsUi = function () {
  const controls = document.querySelector(".controls");
  const open = {};
  TPP.settingsDetails().forEach(function (details, index) {
    open[index] = details.open;
  });
  TPP.writeSettingsUi({
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
  if (TPP.view === "interior") TPP.renderInterior();
  if (TPP.view === "cover") TPP.renderCover();
  if (TPP.view === "reader") TPP.renderReader();
  if (TPP.view === "library") TPP.renderLibrary();
};
TPP.readerNav = function (pages) {
  const options = ['<option value="0">Front Cover</option>'];
  const tocIndex = pages.findIndex(function (p) { return p.type === "toc"; });
  if (tocIndex >= 0) options.push('<option value="' + tocIndex + '">Table of Contents</option>');
  TPP.active.chapters.forEach(function (chapter) {
    const index = pages.findIndex(function (p) { return p.html.includes(TPP.esc(chapter.title || "")); });
    if (index >= 0) options.push('<option value="' + index + '">' + "— ".repeat(chapter.level || 0) + TPP.esc(chapter.title || "Untitled") + "</option>");
  });
  options.push('<option value="' + (pages.length - 1) + '">Last Page</option>');
  document.getElementById("readerJump").innerHTML = options.join("");
  document.getElementById("readerJump").value = TPP.readerIndex;
};
TPP.renderReader = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  TPP.readerNav(pages);
  TPP.readerIndex = Math.max(0, Math.min(TPP.readerIndex, pages.length - 1));
  const mode = document.getElementById("readerMode").value;
  const frontCover = pages[TPP.readerIndex] && pages[TPP.readerIndex].role === "front";
  const spineW = frontCover ? TPP.spineWidth(settings) : 0;
  const shown = mode === "spread" ? (frontCover ? [pages[TPP.readerIndex]] : [pages[TPP.readerIndex], pages[TPP.readerIndex + 1] || null]) : [pages[TPP.readerIndex]];
  const spread = document.createElement("div");
  spread.className = "spread";
  const readerWidth = frontCover ? settings.page.w + spineW : (mode === "spread" ? settings.page.w * 2.25 : settings.page.w);
  const scale = Math.min(5, Math.max(1.2, (window.innerWidth - 560) / (readerWidth * 96)));
  spread.style.transform = "scale(" + scale + ")";
  shown.forEach(function (page) {
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
    spread.appendChild(shell);
  });
  document.getElementById("readerPreview").innerHTML = "";
  document.getElementById("readerPreview").appendChild(spread);
};
