let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleInput(event) {
      const entry = event.target.closest(".book-info-entry");
      if (!entry) return false;
      TPP.sync("draft");
      TPP.scheduleEditorRender("preserve", { debounce: true, delay: 64 });
      return true;
    },
    handleChange(event) {
      const entry = event.target.closest(".book-info-entry");
      if (!entry) return false;
      TPP.sync("commit");
      TPP.scheduleEditorRender("preserve");
      return true;
    },
    handleClick(event) {
      const pickerButton = event.target.closest("[data-book-info-picker]");
      if (pickerButton) {
        TPP.sync("nosave");
        TPP.openBookInfoPickerDialog(
          pickerButton.dataset.bookInfoPickerKind,
          pickerButton.dataset.bookInfoPicker,
        );
        return true;
      }

      const classificationButton = event.target.closest(
        "[data-book-info-classification]",
      );
      if (classificationButton) {
        TPP.sync("nosave");
        TPP.openClassificationDialog(
          classificationButton.dataset.bookInfoClassification,
        );
        return true;
      }

      const actionButton = event.target.closest("[data-book-info-action]");
      if (actionButton) {
        TPP.sync("nosave");
        const group = actionButton.closest(".book-info-entry");
        if (group) TPP.removeBookInfoEntry(TPP.active, group.dataset.entryId);
        TPP.save();
        TPP.loadForm();
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      const addButton = event.target.closest("#bookInfoAddButton");
      if (addButton) {
        const select = document.getElementById("bookInfoAddField");
        const value = select && select.value;
        if (!value) return true;
        TPP.sync("nosave");
        TPP.addBookInfoEntry(TPP.active, value);
        TPP.save();
        TPP.loadForm();
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      return false;
    },
  };
}
