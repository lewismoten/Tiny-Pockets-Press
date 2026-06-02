let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    async handleClick(event) {
      const undoButton = event.target.closest("#undoDraft");
      if (undoButton) {
        event.preventDefault();
        if (TPP.active) TPP.undoDraftStep(TPP.bookId(TPP.active));
        return true;
      }
      const revertButton = event.target.closest("#revertDraft");
      if (revertButton) {
        event.preventDefault();
        if (TPP.active) TPP.revertDraftBook(TPP.bookId(TPP.active));
        return true;
      }
      const saveButton = event.target.closest("#saveBook");
      if (!saveButton) return false;
      event.preventDefault();
      await TPP.saveActiveBook();
      return true;
    },
  };
}
