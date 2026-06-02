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
        TPP.exportBookDownload(TPP.active);
        return true;
      }
      const libraryButton = event.target.closest("#libraryDownloadLibrary");
      if (libraryButton) {
        event.preventDefault();
        TPP.exportLibraryDownload();
        return true;
      }
      return false;
    },
  };
}
