let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const bookButton = event.target.closest("#aboutDownloadBook");
      if (bookButton) {
        event.preventDefault();
        TPP.sync();
        TPP.markBookExported(TPP.active);
        TPP.save();
        TPP.download(TPP.bookExportName(TPP.active), {
          type: "tiny-pockets-book",
          schemaVersion: TPP.SCHEMA_VERSION,
          book: TPP.active,
        });
        return true;
      }
      const libraryButton = event.target.closest("#libraryDownloadLibrary");
      if (libraryButton) {
        event.preventDefault();
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
        return true;
      }
      return false;
    },
  };
}
