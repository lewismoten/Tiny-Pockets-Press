let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const button = event.target.closest(".asset-picker-open");
      if (!button) return false;
      const root = button.closest(
        "#coverImageSlot, #backImageSlot, #spineImageSlot",
      );
      if (!root) return false;
      event.preventDefault();
      TPP.openAssetDialog(button.dataset.targetType, button.dataset.targetKey);
      return true;
    },
  };
}
