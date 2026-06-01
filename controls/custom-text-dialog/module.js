let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openCustomTextDialog };
  initialized = true;
  const dialog = document.getElementById("customTextDialog");
  const body = document.getElementById("customTextDialogBody");
  const title = document.getElementById("customTextDialogTitle");
  TPP.applyCustomTextDialog = function () {
    if (!body || !TPP.customTextDialogTargetId) return;
    const group = document.querySelector(
      '.text-element-group[data-text-id="' +
        TPP.customTextDialogTargetId +
        '"]',
    );
    if (!group) return;
    const valueInput = group.querySelector(".back-cover-text-custom-value");
    const label = group.querySelector(".back-cover-text-field-label");
    const nextValue = body.value || "";
    if (valueInput) valueInput.value = nextValue;
    if (label) label.textContent = nextValue.trim() || "Custom text";
    if (TPP.readSingleTextElementGroup) {
      TPP.readSingleTextElementGroup(TPP.active, group);
      if (TPP.syncLegacyTextFieldsFromElements) {
        TPP.syncLegacyTextFieldsFromElements(TPP.active);
      }
    }
    TPP.save("commit", TPP.bookId(TPP.active));
    const location = String(group.dataset.location || "").trim();
    TPP.renderTextElementControls();
    if (TPP.patchVisibleCoverTextPreview(location)) {
      if (TPP.renderColorPalettes) TPP.renderColorPalettes();
      return;
    }
    if (typeof TPP.renderCurrentViewPreservingSidebar === "function") {
      TPP.renderCurrentViewPreservingSidebar();
    }
  };
  TPP._openCustomTextDialog = function (group) {
    if (!group || !dialog || !body || typeof dialog.showModal !== "function") {
      return;
    }
    TPP.customTextDialogTargetId = group.dataset.textId || "";
    if (title) title.textContent = "Edit Custom Text";
    const valueInput = group.querySelector(".back-cover-text-custom-value");
    body.value = (valueInput && valueInput.value) || "";
    if (!dialog.open) dialog.showModal();
    setTimeout(function () {
      body.focus();
      body.select();
    }, 0);
  };
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close("cancel");
        return;
      }
      const actionButton = e.target.closest("[data-action]");
      if (!actionButton) return;
      const action = actionButton.dataset.action || "";
      if (action === "cancel" && dialog.open) {
        dialog.close("cancel");
        return;
      }
      if (action === "save" && dialog.open) {
        TPP.applyCustomTextDialog();
        dialog.close("save");
      }
    });
  }
  return { open: TPP._openCustomTextDialog };
}
