let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const createNewBook = function () {
    const book = TPP.norm(TPP.fallbackBook());
    book.title = "Untitled Tiny Book";
    book.chapters = [
      {
        id: TPP.uid(),
        title: "New Chapter",
        tocTitle: "",
        text: "",
        imageId: "",
        imageElementId: "",
        imagePlacement: "none",
        imageZoom: 70,
        imageRotate: 0,
        level: 0,
        isSubsection: false,
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
  };

  const duplicateActiveBook = function () {
    TPP.sync();
    const name = prompt(
      "Title for duplicated book:",
      "Copy of " + TPP.active.title,
    );
    if (name === null) return;
    const stamp = TPP.nowIso();
    const book = TPP.bookDescendant(
      TPP.active,
      {
        id: TPP.uid(),
        title: name || "Copy of " + TPP.active.title,
      },
      "copy",
      stamp,
    );
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  const deleteActiveBook = function () {
    if (TPP.library.length <= 1) return alert("Keep at least one book.");
    if (confirm("Delete this book?")) {
      TPP.library = TPP.library.filter(function (book) {
        return TPP.bookId(book) !== TPP.bookId(TPP.active);
      });
      TPP.save();
      TPP.setActive(TPP.library[0]);
    }
  };

  return {
    handleClick(event) {
      const newBook = event.target.closest("#libraryNewBook");
      if (newBook) {
        event.preventDefault();
        createNewBook();
        return true;
      }
      const duplicate = event.target.closest("#aboutDuplicateBook");
      if (duplicate) {
        event.preventDefault();
        duplicateActiveBook();
        return true;
      }
      const remove = event.target.closest("#aboutDeleteBook");
      if (remove) {
        event.preventDefault();
        deleteActiveBook();
        return true;
      }
      const upload = event.target.closest("#libraryUploadBook");
      if (upload) {
        event.preventDefault();
        TPP.openLibraryUploadDialog();
        return true;
      }
      const card = event.target.closest("#libraryGrid [data-id]");
      if (card) {
        const book = TPP.library.find(function (b) {
          return TPP.bookId(b) === card.dataset.id;
        });
        if (!book) return true;
        const cover = event.target.closest(".library-cover");
        if (cover) {
          TPP.setActive(book);
          TPP.switchView("editor");
          return true;
        }
        const button = event.target.closest("[data-act]");
        if (!button) return true;
        if (button.dataset.act === "edit") {
          TPP.setActive(book);
          TPP.switchView("editor");
        }
        if (button.dataset.act === "about") {
          TPP.setActive(book);
          TPP.switchView("about");
        }
        if (button.dataset.act === "view") {
          TPP.setActive(book);
          TPP.switchView("reader");
        }
        if (button.dataset.act === "dup") {
          const name = prompt(
            "Title for duplicated book:",
            "Copy of " + book.title,
          );
          if (name !== null) {
            const stamp = TPP.nowIso();
            const copy = TPP.bookDescendant(
              book,
              {
                id: TPP.uid(),
                title: name || "Copy of " + book.title,
              },
              "copy",
              stamp,
            );
            TPP.library.push(copy);
            TPP.save();
            TPP.renderLibrary();
          }
        }
        if (button.dataset.act === "export") {
          TPP.markBookExported(book);
          TPP.save();
          TPP.download(TPP.bookExportName(book), {
            type: "tiny-pockets-book",
            schemaVersion: TPP.SCHEMA_VERSION,
            book: book,
          });
        }
        return true;
      }
      return false;
    },
    handleInput(event) {
      const search = event.target.closest("#librarySearch");
      if (!search) return false;
      TPP.renderLibrary();
      return true;
    },
  };
}
