let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

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
