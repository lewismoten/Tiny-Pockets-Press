let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const openInterior = event.target.closest("#openInteriorView");
      if (openInterior) {
        event.preventDefault();
        if (
          TPP.UI &&
          TPP.UI.Views &&
          typeof TPP.UI.Views.switchView === "function"
        ) {
          TPP.UI.Views.switchView("interior");
        } else {
          TPP.switchView("interior");
        }
        return true;
      }
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
      const epub = event.target.closest("#exportEpub");
      if (epub) {
        event.preventDefault();
        TPP.exportEpub();
        return true;
      }
      const images = event.target.closest("#exportImagesZip");
      if (images) {
        event.preventDefault();
        TPP.openImageExportDialog();
        return true;
      }
      const openCover = event.target.closest("#openCoverView");
      if (openCover) {
        event.preventDefault();
        if (
          TPP.UI &&
          TPP.UI.Views &&
          typeof TPP.UI.Views.switchView === "function"
        ) {
          TPP.UI.Views.switchView("cover");
        } else {
          TPP.switchView("cover");
        }
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
