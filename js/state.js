window.TPP = window.TPP || {};
TPP.SCHEMA_VERSION = 1;
TPP.LIB = "tinyPocketsPressV61";
TPP.ACTIVE = "tinyPocketsPressActiveV61";
TPP.UI = "tinyPocketsPressUiV61";
TPP.library = [];
TPP.active = null;
TPP.view = "editor";
TPP.currentChapter = 0;
TPP.readerIndex = 0;
TPP.lastPages = [];
TPP.bookFingerprints = {};
TPP.bookDraftFingerprints = {};
TPP.bookRevisionTimers = {};

TPP.clone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};
TPP.nowIso = function () {
  return new Date().toISOString();
};
TPP.bookExportName = function (book) {
  if (!book) return "book.json";
  if (TPP.active && book.id === TPP.active.id && TPP.sync) TPP.sync("nosave");
  const title = (book.title || "").trim();
  return (title || "book") + ".json";
};
TPP.esc = function (value) {
  return String(value ?? "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
  });
};
TPP.signatureSize = function (value) {
  const fallback = 16;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(4, Math.min(64, Math.round(n / 4) * 4)) || fallback;
};
TPP.sewingStations = function (value) {
  const n = Math.round(Number(value) || 0);
  return Math.max(2, Math.min(5, n || 3));
};
TPP.opacity = function (value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
};
TPP.dpi = function (value) {
  const n = Math.round(Number(value) || 0);
  return Math.max(72, Math.min(1200, n || 300));
};
TPP.mediaCaptionSize = function (value, fallback) {
  const n = Number(value);
  const base = Number(fallback) || 3;
  if (!Number.isFinite(n)) return base;
  return Math.max(2, Math.min(12, n));
};
TPP.bookFingerprint = function (book) {
  const copy = TPP.clone(book || {});
  delete copy.schemaVersion;
  delete copy.revision;
  delete copy.subrevision;
  delete copy.provenance;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.lastExportedAt;
  delete copy.lastImportedAt;
  delete copy.coverPreview;
  delete copy._pageCount;
  return JSON.stringify(copy);
};
TPP.hydrateBookDates = function (book) {
  const now = TPP.nowIso();
  if (!Number.isFinite(Number(book.schemaVersion)) || Number(book.schemaVersion) < 1) book.schemaVersion = 1;
  book.schemaVersion = Math.max(1, Math.floor(Number(book.schemaVersion) || 1));
  if (!Number.isFinite(Number(book.revision)) || Number(book.revision) < 1) book.revision = 1;
  book.revision = Math.max(1, Math.floor(Number(book.revision) || 1));
  if (!Number.isFinite(Number(book.subrevision)) || Number(book.subrevision) < 0) book.subrevision = 0;
  book.subrevision = Math.max(0, Math.floor(Number(book.subrevision) || 0));
  if (!Array.isArray(book.provenance) && Array.isArray(book.ancestry)) book.provenance = TPP.clone(book.ancestry);
  if (!Array.isArray(book.provenance)) book.provenance = [];
  delete book.ancestry;
  if (!book.createdAt && book.updatedAt) book.createdAt = book.updatedAt;
  if (!book.createdAt) book.createdAt = now;
  if (!book.updatedAt) book.updatedAt = book.createdAt;
  if (!("lastExportedAt" in book)) book.lastExportedAt = "";
  if (!("lastImportedAt" in book)) book.lastImportedAt = "";
  book.schemaVersion = TPP.SCHEMA_VERSION;
  return book;
};
TPP.unwrapImportPayload = function (data) {
  if (!data || typeof data !== "object") return { kind: "book", value: data };
  if (Array.isArray(data.books)) return { kind: "library", value: data.books, schemaVersion: Number(data.schemaVersion) || 1 };
  if (data.book && typeof data.book === "object") return { kind: "book", value: data.book, schemaVersion: Number(data.schemaVersion) || Number(data.book.schemaVersion) || 1 };
  if (data.style && typeof data.style === "object") return { kind: "style", value: data.style, schemaVersion: Number(data.schemaVersion) || 1 };
  return { kind: "book", value: data, schemaVersion: Number(data.schemaVersion) || 1 };
};
TPP.bookSourceEntry = function (book, action, stamp) {
  const when = stamp || TPP.nowIso();
  return {
    action: action || "copy",
    sourceId: book && book.id ? book.id : "",
    sourceTitle: book && book.title ? book.title : "",
    sourceRevision: Math.max(1, Math.floor(Number(book && book.revision) || 1)),
    sourceSubrevision: Math.max(0, Math.floor(Number(book && book.subrevision) || 0)),
    sourceUpdatedAt: book && book.updatedAt ? book.updatedAt : when,
    sourceCreatedAt: book && book.createdAt ? book.createdAt : when,
    recordedAt: when
  };
};
TPP.combineProvenance = function (a, b) {
  const seen = new Set();
  return (Array.isArray(a) ? a : []).concat(Array.isArray(b) ? b : []).filter(function (entry) {
    const key = JSON.stringify(entry || {});
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
TPP.bookDescendant = function (source, overrides, action, stamp) {
  const when = stamp || TPP.nowIso();
  const descendant = TPP.norm(Object.assign({}, TPP.clone(source || {}), overrides || {}));
  descendant.id = (overrides && overrides.id) || descendant.id || TPP.uid();
  descendant.revision = 1;
  descendant.subrevision = 0;
  descendant.createdAt = when;
  descendant.updatedAt = when;
  descendant.lastExportedAt = "";
  descendant.lastImportedAt = action === "import" ? when : "";
  descendant.provenance = (Array.isArray(source && source.provenance) ? TPP.clone(source.provenance) : []);
  descendant.provenance.push(TPP.bookSourceEntry(source, action, when));
  return descendant;
};
TPP.bookImported = function (source, stamp) {
  const when = stamp || TPP.nowIso();
  const imported = TPP.norm(TPP.clone(source || {}));
  imported.lastImportedAt = when;
  imported.provenance = TPP.combineProvenance(imported.provenance, [TPP.bookSourceEntry(source, "import", when)]);
  return imported;
};
TPP.mergeImportedBook = function (existing, incoming, stamp) {
  const when = stamp || TPP.nowIso();
  const merged = TPP.norm(Object.assign({}, TPP.clone(existing || {}), TPP.clone(incoming || {})));
  merged.id = existing && existing.id ? existing.id : merged.id;
  merged.createdAt = existing && existing.createdAt ? existing.createdAt : merged.createdAt;
  merged.updatedAt = incoming && incoming.updatedAt ? incoming.updatedAt : merged.updatedAt;
  merged.revision = Math.max(
    1,
    Math.floor(Number(existing && existing.revision) || 1),
    Math.floor(Number(incoming && incoming.revision) || 1)
  );
  merged.subrevision = 0;
  merged.lastImportedAt = when;
  merged.lastExportedAt = existing && existing.lastExportedAt ? existing.lastExportedAt : (incoming && incoming.lastExportedAt) || "";
  merged.provenance = TPP.combineProvenance(
    TPP.combineProvenance(existing && existing.provenance, incoming && incoming.provenance),
    [TPP.bookSourceEntry(incoming, "import", when)]
  );
  return merged;
};
TPP.resolveImportConflict = function (incoming, existing) {
  return Promise.resolve("cancel");
};
TPP.markBookExported = function (book, stamp) {
  if (!book) return;
  book.lastExportedAt = stamp || TPP.nowIso();
};
TPP.markBookImported = function (book, stamp) {
  if (!book) return;
  book.lastImportedAt = stamp || TPP.nowIso();
};
TPP.norm = function (book) {
  const base = TPP.fallbackBook();
  const out = Object.assign({}, base, book || {});
  out.id = out.id || TPP.uid();
  out.signatureSize = TPP.signatureSize(out.signatureSize);
  out.sewingStations = TPP.sewingStations(out.sewingStations);
  out.sewingGuideOpacity = TPP.opacity(out.sewingGuideOpacity, 0.65);
  out.signatureGuideOpacity = TPP.opacity(out.signatureGuideOpacity, 0.65);
  out.imageExportDpi = TPP.dpi(out.imageExportDpi);
  out.mediaCaptionSize = TPP.mediaCaptionSize(out.mediaCaptionSize, base.mediaCaptionSize);
  TPP.hydrateBookDates(out);
  out.chapters = Array.isArray(out.chapters) && out.chapters.length ? out.chapters : base.chapters;
  out.chapters = out.chapters.map(function (chapter, index) {
    return Object.assign({
      id: TPP.uid(),
      title: "Chapter " + (index + 1),
      text: "",
      imageData: "",
      imagePlacement: "none",
      imageWidth: 70,
      level: 0,
      isSubsection: false,
      isMetadata: false,
      includeInToc: true,
      tocTitle: ""
    }, chapter);
  });
  return out;
};
TPP.load = async function () {
  try {
    TPP.library = JSON.parse(localStorage.getItem(TPP.LIB) || "[]");
  } catch {
    TPP.library = [];
  }
  if (!TPP.library.length) {
    let sample = null;
    try {
      sample = await fetch("data/sample-book.json").then(function (response) {
        return response.json();
      });
    } catch {
      sample = TPP.fallbackBook();
    }
    TPP.library = [TPP.norm(sample)];
    TPP.save();
  }
  TPP.library = TPP.library.map(TPP.norm);
  TPP.bookFingerprints = {};
  TPP.bookDraftFingerprints = {};
  TPP.library.forEach(function (book) {
    const fingerprint = TPP.bookFingerprint(book);
    TPP.bookFingerprints[book.id] = fingerprint;
    TPP.bookDraftFingerprints[book.id] = fingerprint;
  });
  const activeId = localStorage.getItem(TPP.ACTIVE);
  TPP.active = TPP.library.find(function (book) { return book.id === activeId; }) || TPP.library[0];
};
TPP.clearRevisionTimer = function (bookId) {
  if (!TPP.bookRevisionTimers[bookId]) return;
  clearTimeout(TPP.bookRevisionTimers[bookId]);
  delete TPP.bookRevisionTimers[bookId];
};
TPP.scheduleRevisionCommit = function (bookId, delay) {
  if (!bookId) return;
  TPP.clearRevisionTimer(bookId);
  TPP.bookRevisionTimers[bookId] = setTimeout(function () {
    const book = TPP.library.find(function (entry) { return entry.id === bookId; });
    if (!book) return;
    TPP.save("commit", bookId);
  }, Math.max(100, Number(delay) || 900));
};
TPP.save = function (mode, bookId) {
  mode = mode || "commit";
  const targetIds = bookId ? [bookId] : TPP.library.map(function (book) { return book.id; });
  TPP.library.forEach(function (book) {
    if (!targetIds.includes(book.id)) return;
    TPP.hydrateBookDates(book);
    const previous = TPP.bookFingerprints[book.id];
    const priorDraft = TPP.bookDraftFingerprints[book.id];
    const current = TPP.bookFingerprint(book);
    if (mode === "draft") {
      if (priorDraft !== current) {
        if (previous !== undefined && current !== previous) {
          book.subrevision = Math.max(0, Math.floor(Number(book.subrevision) || 0)) + 1;
          book.updatedAt = TPP.nowIso();
        } else {
          book.subrevision = 0;
        }
      }
      TPP.bookDraftFingerprints[book.id] = current;
    } else {
      TPP.clearRevisionTimer(book.id);
      if (previous !== undefined && current !== previous) {
        book.revision = Math.max(1, Math.floor(Number(book.revision) || 1)) + 1;
        book.subrevision = 0;
        book.updatedAt = TPP.nowIso();
      } else if (book.subrevision) {
        book.subrevision = 0;
      }
      TPP.bookFingerprints[book.id] = current;
      TPP.bookDraftFingerprints[book.id] = current;
    }
  });
  localStorage.setItem(TPP.LIB, JSON.stringify(TPP.library));
};
TPP.setActive = function (book) {
  TPP.active = book;
  localStorage.setItem(TPP.ACTIVE, book.id);
  TPP.loadForm();
  if (TPP.restoreReaderUi) TPP.restoreReaderUi(TPP.readSettingsUi ? TPP.readSettingsUi() : {});
  TPP.renderAll();
};
TPP.download = function (name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  TPP.downloadBlob(name, blob);
};
TPP.downloadBlob = function (name, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = String(name).replace(/[/\\?%*:|"<>]/g, "-");
  link.click();
  URL.revokeObjectURL(url);
};
TPP.showProgress = function (pct, msg) {
  const wrap = document.getElementById("progress");
  const bar = document.getElementById("progressBar");
  const text = document.getElementById("progressText");
  if (!wrap || !bar || !text) return;
  wrap.hidden = false;
  bar.style.width = Math.max(2, Math.min(100, pct)) + "%";
  text.textContent = msg || "Rendering…";
  if (pct >= 100) setTimeout(function () { wrap.hidden = true; }, 800);
};
TPP.file = function (event, callback) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () { callback(reader.result); };
  reader.readAsDataURL(file);
};
