let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const syncCopyrightGroup = function (event, mode) {
    const item = event.target.closest(".copyright-item-group");
    if (!item || !TPP.readSingleCopyrightItemGroup) return false;
    TPP.readSingleCopyrightItemGroup(TPP.active, item);

    if (mode === "draft") {
      if (TPP.scheduleDraftSave) {
        TPP.scheduleDraftSave(TPP.bookId(TPP.active), 180);
      } else {
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.scheduleRevisionCommit(TPP.bookId(TPP.active));
      }
      if (event.target.classList.contains("copyright-field-key")) {
        TPP.renderTextElementControls();
      }
      TPP.scheduleEditorRender(TPP.editorRenderActionForTarget(event.target), {
        debounce: true,
        delay: 64,
      });
      return true;
    }

    TPP.save("commit", TPP.bookId(TPP.active));
    if (event.target.classList.contains("copyright-field-key")) {
      TPP.renderTextElementControls();
    }
    TPP.scheduleEditorRender(TPP.editorRenderActionForTarget(event.target));
    return true;
  };

  return {
    handleInput(event) {
      return syncCopyrightGroup(event, "draft");
    },
    handleChange(event) {
      return syncCopyrightGroup(event, "commit");
    },
    handleClick(event) {
      const button = event.target.closest("[data-copyright-action]");
      if (!button) return false;
      TPP.sync("nosave");
      const action = button.dataset.copyrightAction;
      const group = button.closest(".copyright-item-group");
      if (action === "add") TPP.addCopyrightPageItem(TPP.active);
      if (action === "remove" && group) {
        TPP.removeCopyrightPageItem(TPP.active, group.dataset.itemId);
      }
      TPP.save();
      TPP.renderAll();
      return true;
    },
  };
}
