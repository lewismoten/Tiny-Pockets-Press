let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  TPP.readerGoPrevImpl = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    TPP.readerIndex = TPP.readerNormalizeIndex(
      TPP.readerIndex - (mode === "spread" ? 2 : 1),
      pages,
      mode,
      settings,
    );
    TPP.renderReader();
  };

  TPP.readerGoNextImpl = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    const next =
      mode === "spread" && TPP.readerIndex === 0
        ? 1
        : TPP.readerIndex + (mode === "spread" ? 2 : 1);
    TPP.readerIndex = TPP.readerNormalizeIndex(next, pages, mode, settings);
    TPP.renderReader();
  };

  return {
    handleClick(event) {
      const prev = event.target.closest("#readerStagePrev");
      if (prev) {
        event.preventDefault();
        TPP.readerGoPrevImpl();
        return true;
      }
      const next = event.target.closest("#readerStageNext");
      if (next) {
        event.preventDefault();
        TPP.readerGoNextImpl();
        return true;
      }
      return false;
    },
    handleChange(event) {
      const jump = event.target.closest("#readerJump");
      if (jump) {
        TPP.readerIndex = Number(document.getElementById("readerJump").value);
        TPP.renderReader();
        return true;
      }
      const mode = event.target.closest("#readerMode");
      if (mode) {
        TPP.renderReader();
        return true;
      }
      return false;
    },
    handleInput(event) {
      const scrub = event.target.closest("#readerScrub");
      if (!scrub) return false;
      const pages = TPP.buildPages();
      const mode = document.getElementById("readerMode").value;
      const settings = TPP.settings();
      TPP.readerIndex = TPP.readerNormalizeIndex(
        Number(document.getElementById("readerScrub").value),
        pages,
        mode,
        settings,
      );
      TPP.renderReader();
      return true;
    },
  };
}
