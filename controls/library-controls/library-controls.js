let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const newBook = event.target.closest("#libraryNewBook");
      if (newBook) {
        event.preventDefault();
        TPP.createNewBook();
        return true;
      }
      const duplicate = event.target.closest("#aboutDuplicateBook");
      if (duplicate) {
        event.preventDefault();
        TPP.sync();
        TPP.duplicateBook(TPP.active, { activate: true });
        return true;
      }
      const remove = event.target.closest("#aboutDeleteBook");
      if (remove) {
        event.preventDefault();
        TPP.deleteActiveBook();
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
          TPP.duplicateBook(book, { renderLibrary: true });
        }
        if (button.dataset.act === "export") {
          TPP.exportBookDownload(book);
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
