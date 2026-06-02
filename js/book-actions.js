window.TPP = window.TPP || {};

TPP.importConflictStamp = function (book) {
  const date = new Date(TPP.bookUpdatedAt(book));
  if (Number.isNaN(date.getTime())) {
    return TPP.bookUpdatedAt(book)
      ? String(TPP.bookUpdatedAt(book))
      : "Unknown";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

TPP.importConflictPreview = function (book) {
  const cover =
    book && book.coverPreview
      ? '<img src="' +
        TPP.esc(book.coverPreview) +
        '" alt="' +
        TPP.esc((book && book.title) || "Book cover") +
        '" style="display:block;max-width:100%;height:auto;border-radius:14px;box-shadow:0 14px 30px rgb(0 0 0/.18)">'
      : '<div class="conflict-cover-fallback" style="background:linear-gradient(to bottom,' +
        TPP.esc((book && book.coverBg1) || "#7b1f2a") +
        "," +
        TPP.esc((book && book.coverBg2) || "#251d1d") +
        ')">' +
        TPP.esc((book && book.title) || "Untitled") +
        "</div>";
  return (
    '<article class="conflict-book">' +
    "<h3>" +
    TPP.esc((book && book.title) || "Untitled") +
    "</h3>" +
    '<div class="conflict-cover">' +
    cover +
    "</div>" +
    '<div class="conflict-meta">' +
    "<div><strong>ID:</strong> " +
    TPP.esc(TPP.bookId(book) || "—") +
    "</div>" +
    "<div><strong>Revision:</strong> " +
    TPP.esc(String(TPP.bookRevision(book) || 1)) +
    "." +
    TPP.esc(String(TPP.bookSubrevision(book) || 0)) +
    "</div>" +
    "<div><strong>Modified:</strong> " +
    TPP.esc(TPP.importConflictStamp(book)) +
    "</div>" +
    "</div>" +
    "</article>"
  );
};

TPP.saveActiveBook = async function () {
  if (TPP.active) {
    TPP.setBookSaveUiState(TPP.bookId(TPP.active), {
      saving: true,
      error: false,
    });
  }
  TPP.sync();
  TPP.buildPages();
  const saved = await TPP.captureCover();
  TPP.toast(saved === false ? "Save failed." : "Saved.");
};

TPP.prepareBrowserPrint = function () {
  if (TPP.view !== "interior") return null;
  const interiorPreview = document.getElementById("interiorPreview");
  const coverPreview = document.getElementById("coverPreview");
  if (!interiorPreview || !coverPreview) return null;
  TPP.renderCover();
  const coverSheet = coverPreview.querySelector(".sheet");
  if (!coverSheet) return null;
  const clone = coverSheet.cloneNode(true);
  clone.classList.add("print-extra-cover-page");
  clone.querySelectorAll(".sheet-title").forEach(function (title) {
    title.textContent = "Cover print sheet";
  });
  interiorPreview.appendChild(clone);
  return function cleanupPrintCoverPage() {
    const node = interiorPreview.querySelector(".print-extra-cover-page");
    if (node) node.remove();
  };
};

TPP.exportBookDownload = function (book) {
  if (!book) return;
  TPP.markBookExported(book);
  if (TPP.active && TPP.bookId(book) === TPP.bookId(TPP.active)) {
    TPP.save("draft", TPP.bookId(book));
  } else {
    TPP.save();
  }
  TPP.download(TPP.bookExportName(book), {
    type: "tiny-pockets-book",
    schemaVersion: TPP.SCHEMA_VERSION,
    book: book,
  });
};

TPP.exportLibraryDownload = function () {
  const stamp = TPP.nowIso();
  TPP.library.forEach(function (book) {
    TPP.markBookExported(book, stamp);
  });
  TPP.save();
  TPP.download("tiny-pockets-library.library", {
    type: "tiny-pockets-library",
    schemaVersion: TPP.SCHEMA_VERSION,
    books: TPP.library,
  });
};

TPP.createNewBook = function () {
  const book = TPP.norm(TPP.fallbackBook());
  book.title = "Untitled Tiny Book";
  book.chapters = [
    {
      id: TPP.internalId("c"),
      title: "New Chapter",
      tocTitle: "",
      text: "",
      imageId: "",
      level: 0,
      isMetadata: false,
      includeInToc: true,
    },
  ];
  if (TPP.migrateImageElements) {
    TPP.migrateImageElements(book, TPP.fallbackBook());
  }
  if (TPP.syncLegacyImageFieldsFromElements) {
    TPP.syncLegacyImageFieldsFromElements(book);
  }
  TPP.library.push(book);
  TPP.save();
  TPP.setActive(book);
  return book;
};

TPP.duplicateBook = function (sourceBook, options) {
  const book = sourceBook || TPP.active;
  if (!book) return null;
  const defaultTitle = "Copy of " + (book.title || "Untitled");
  const providedTitle = options && "title" in options ? options.title : null;
  const name =
    providedTitle !== null
      ? providedTitle
      : prompt("Title for duplicated book:", defaultTitle);
  if (name === null) return null;
  const stamp = TPP.nowIso();
  const copy = TPP.bookDescendant(
    book,
    {
      id: TPP.uid(),
      title: name || defaultTitle,
    },
    "copy",
    stamp,
  );
  TPP.library.push(copy);
  TPP.save();
  if (options && options.activate) {
    TPP.setActive(copy);
  } else if (options && options.renderLibrary) {
    TPP.renderLibrary();
  }
  return copy;
};

TPP.deleteActiveBook = function () {
  if (TPP.library.length <= 1) {
    alert("Keep at least one book.");
    return false;
  }
  if (!confirm("Delete this book?")) return false;
  TPP.library = TPP.library.filter(function (book) {
    return TPP.bookId(book) !== TPP.bookId(TPP.active);
  });
  TPP.save();
  TPP.setActive(TPP.library[0]);
  return true;
};

TPP.importLibraryPayload = async function (books) {
  const stamp = TPP.nowIso();
  for (const rawBook of books || []) {
    const incoming = TPP.bookImported(rawBook, stamp);
    const existingIndex = TPP.library.findIndex(function (book) {
      return TPP.bookId(book) === TPP.bookId(incoming);
    });
    if (existingIndex < 0) {
      TPP.library.push(incoming);
      continue;
    }
    const existing = TPP.library[existingIndex];
    const action = await TPP.resolveImportConflict(incoming, existing);
    if (action === "merge") {
      TPP.library[existingIndex] = TPP.mergeImportedBook(
        existing,
        incoming,
        stamp,
      );
    } else if (action === "overwrite") {
      TPP.bookMeta(incoming).lastExportedAt =
        TPP.bookLastExportedAt(existing) ||
        TPP.bookLastExportedAt(incoming) ||
        "";
      TPP.library[existingIndex] = incoming;
    } else if (action === "copy") {
      TPP.library.push(
        TPP.bookDescendant(incoming, { id: TPP.uid() }, "import", stamp),
      );
    }
  }
  TPP.save();
  if (TPP.library[0]) TPP.setActive(TPP.library[0]);
  TPP.switchView("library");
};

TPP.importStylePayload = function (styleData) {
  Object.entries(styleData || {}).forEach(function (entry) {
    TPP.active[entry[0]] = entry[1];
  });
  TPP.save();
  TPP.loadForm();
  TPP.renderAll();
};

TPP.importBookPayload = async function (rawBook) {
  const stamp = TPP.nowIso();
  const incoming = TPP.bookImported(rawBook, stamp);
  const existingIndex = TPP.library.findIndex(function (book) {
    return TPP.bookId(book) === TPP.bookId(incoming);
  });
  if (existingIndex < 0) {
    TPP.library.push(incoming);
    TPP.save();
    TPP.setActive(incoming);
    return incoming;
  }
  const existing = TPP.library[existingIndex];
  const action = await TPP.resolveImportConflict(incoming, existing);
  if (action === "cancel") return null;
  if (action === "merge") {
    TPP.library[existingIndex] = TPP.mergeImportedBook(
      existing,
      incoming,
      stamp,
    );
  } else if (action === "overwrite") {
    TPP.bookMeta(incoming).lastExportedAt =
      TPP.bookLastExportedAt(existing) ||
      TPP.bookLastExportedAt(incoming) ||
      "";
    TPP.library[existingIndex] = incoming;
  } else if (action === "copy") {
    const copy = TPP.bookDescendant(
      incoming,
      { id: TPP.uid() },
      "import",
      stamp,
    );
    TPP.library.push(copy);
    TPP.save();
    TPP.setActive(copy);
    return copy;
  }
  TPP.save();
  TPP.setActive(TPP.library[existingIndex]);
  return TPP.library[existingIndex];
};

TPP.processImportPayload = async function (payload) {
  if (!payload) return null;
  if (payload.kind === "library") {
    await TPP.importLibraryPayload(payload.value);
    return "library";
  }
  if (payload.kind === "style") {
    TPP.importStylePayload(payload.value);
    return "style";
  }
  await TPP.importBookPayload(payload.value);
  return "book";
};
