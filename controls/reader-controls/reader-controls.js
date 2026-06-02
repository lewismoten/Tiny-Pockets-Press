let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const prev = event.target.closest("#readerStagePrev");
      if (prev) {
        event.preventDefault();
        if (TPP.Reader && typeof TPP.Reader.goPrev === "function") {
          TPP.Reader.goPrev();
        } else {
          TPP.readerGoPrevImpl();
        }
        return true;
      }
      const next = event.target.closest("#readerStageNext");
      if (next) {
        event.preventDefault();
        if (TPP.Reader && typeof TPP.Reader.goNext === "function") {
          TPP.Reader.goNext();
        } else {
          TPP.readerGoNextImpl();
        }
        return true;
      }
      return false;
    },
    handleChange(event) {
      const jump = event.target.closest("#readerJump");
      if (jump) {
        if (TPP.Reader) {
          TPP.Reader.index = Number(
            document.getElementById("readerJump").value,
          );
        } else {
          TPP.readerIndex = Number(document.getElementById("readerJump").value);
        }
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
      const mode =
        TPP.Reader && typeof TPP.Reader.currentMode === "function"
          ? TPP.Reader.currentMode()
          : TPP.readerCurrentMode();
      const settings = TPP.settings();
      const nextIndex =
        TPP.Reader && typeof TPP.Reader.normalizeIndex === "function"
          ? TPP.Reader.normalizeIndex(
              Number(document.getElementById("readerScrub").value),
              pages,
              mode,
              settings,
            )
          : TPP.readerNormalizeIndex(
              Number(document.getElementById("readerScrub").value),
              pages,
              mode,
              settings,
            );
      if (TPP.Reader) {
        TPP.Reader.index = nextIndex;
      } else {
        TPP.readerIndex = nextIndex;
      }
      TPP.renderReader();
      return true;
    },
  };
}
