let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const interior = event.target.closest("#exportInteriorPdf");
      if (interior) {
        event.preventDefault();
        TPP.exportPdfFrom("interior");
        return true;
      }
      const readable = event.target.closest("#exportReadablePdf");
      if (readable) {
        event.preventDefault();
        TPP.exportReadablePdf();
        return true;
      }
      const images = event.target.closest("#exportImagesZip");
      if (images) {
        event.preventDefault();
        TPP.openImageExportDialog();
        return true;
      }
      const cover = event.target.closest("#exportCoverPdf");
      if (cover) {
        event.preventDefault();
        TPP.exportPdfFrom("cover");
        return true;
      }
      const printButton = event.target.closest("#printBrowser");
      if (printButton) {
        event.preventDefault();
        const cleanup = TPP.prepareBrowserPrint();
        const finalize = function () {
          window.removeEventListener("afterprint", finalize);
          if (typeof cleanup === "function") cleanup();
        };
        window.addEventListener("afterprint", finalize);
        setTimeout(function () {
          print();
          setTimeout(function () {
            finalize();
          }, 180);
        }, 80);
        return true;
      }
      return false;
    },
  };
}
