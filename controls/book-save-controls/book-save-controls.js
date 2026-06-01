let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    async handleClick(event) {
      const saveButton = event.target.closest("#saveBook");
      if (!saveButton) return false;
      event.preventDefault();
      TPP.sync();
      TPP.buildPages();
      await TPP.captureCover();
      TPP.toast("Saved.");
      return true;
    },
  };
}
