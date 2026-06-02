let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const confirmRemoval = function (label, references) {
    const dialog = document.getElementById("bookInfoRemoveDialog");
    const body = document.getElementById("bookInfoRemoveDialogBody");
    const usageWrap = document.getElementById("bookInfoRemoveDialogUsageWrap");
    const usageList = document.getElementById("bookInfoRemoveDialogUsageList");
    const title = document.getElementById("bookInfoRemoveDialogTitle");
    if (!dialog || typeof dialog.showModal !== "function") {
      return Promise.resolve(
        window.confirm(
          'Remove "' +
            label +
            '" and all references to it?\n\nUsed in:\n- ' +
            references
              .map(function (item) {
                return item.label;
              })
              .join("\n- "),
        ),
      );
    }
    if (title) title.textContent = 'Remove "' + label + '"?';
    if (body) {
      body.textContent = references.length
        ? "This field is currently in use. Removing it will also remove all linked text placements."
        : "Remove this field from Book Info?";
    }
    if (usageWrap && usageList) {
      usageList.innerHTML = references
        .map(function (item) {
          return "<li>" + TPP.esc(item.label) + "</li>";
        })
        .join("");
      usageWrap.hidden = !references.length;
    }
    return new Promise(function (resolve) {
      const cleanup = function (value) {
        dialog.removeEventListener("click", clickHandler);
        dialog.removeEventListener("cancel", cancelHandler);
        dialog.removeEventListener("close", closeHandler);
        resolve(value);
      };
      const closeHandler = function () {
        cleanup(dialog.returnValue === "confirm");
      };
      const cancelHandler = function () {
        cleanup(false);
      };
      const clickHandler = function (e) {
        const card = e.target.closest(".modal-card");
        if (e.target === dialog && !card && dialog.open) {
          dialog.close("cancel");
          return;
        }
        const action = e.target.closest("[data-action]")?.dataset.action;
        if (!action) return;
        if (action === "cancel" && dialog.open) {
          dialog.close("cancel");
          return;
        }
        if (action === "confirm" && dialog.open) {
          dialog.close("confirm");
        }
      };
      dialog.addEventListener("click", clickHandler);
      dialog.addEventListener("cancel", cancelHandler, { once: true });
      dialog.addEventListener("close", closeHandler, { once: true });
      dialog.showModal();
    });
  };

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
      TPP.sync("draft");
      TPP.scheduleEditorRender("preserve");
      return true;
    },
    async handleClick(event) {
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
        if (group) {
          const entry = TPP.bookInfoEntryById(TPP.active, group.dataset.entryId);
          const references = entry
            ? TPP.bookInfoUsageReferences(TPP.active, entry)
            : [];
          if (references.length) {
            const label = TPP.bookInfoFieldLabel(
              entry.key === "custom" ? "custom:" + entry.id : entry.key,
              TPP.active,
            );
            const confirmed = await confirmRemoval(label, references);
            if (!confirmed) return true;
            TPP.removeBookInfoReferences(TPP.active, entry);
          }
          TPP.removeBookInfoEntry(TPP.active, group.dataset.entryId);
        }
        TPP.save("draft", TPP.bookId(TPP.active));
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
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.loadForm();
        TPP.renderCurrentViewPreservingSidebar();
        return true;
      }

      return false;
    },
  };
}
