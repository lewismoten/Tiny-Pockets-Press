let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const tab = event.target.closest(".tab");
      if (tab && tab.dataset.view) {
        event.preventDefault();
        TPP.switchView(tab.dataset.view);
        return true;
      }

      const toggle = event.target.closest("#toggleBookButtonText");
      if (toggle) {
        event.preventDefault();
        const state = TPP.readSettingsUi();
        const show = state.showBookButtonText === false;
        TPP.setBookButtonTextVisibility(show);
        TPP.writeSettingsUi(
          Object.assign({}, state, { showBookButtonText: show }),
        );
        TPP.saveSettingsUi();
        return true;
      }

      return false;
    },
  };
}
