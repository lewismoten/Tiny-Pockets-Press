let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openCoverTextFieldDialog };
  initialized = true;
  const addCustomFieldToTextList = function () {
    const nameInput = document.getElementById("frontCoverFieldDialogCustomName");
    const valueInput = document.getElementById(
      "frontCoverFieldDialogCustomValue",
    );
    const name = String((nameInput && nameInput.value) || "").trim();
    const value = String((valueInput && valueInput.value) || "").trim();
    if (!name) {
      if (nameInput) nameInput.focus();
      return false;
    }
    TPP.sync("nosave");
    const entry = TPP.addBookInfoEntry(TPP.active, "custom");
    if (!entry) return false;
    entry.customLabel = name;
    entry.value = value;
    TPP.addTextElement(
      TPP.active,
      TPP.frontCoverFieldDialogLocation || "front",
      TPP.bookInfoFieldRef(entry),
    );
    TPP.save("draft", TPP.bookId(TPP.active));
    const dialog = document.getElementById("frontCoverFieldDialog");
    if (dialog && dialog.open) dialog.close("selected");
    if (nameInput) nameInput.value = "";
    if (valueInput) valueInput.value = "";
    TPP.loadForm();
    if (typeof TPP.renderCurrentViewPreservingSidebar === "function") {
      TPP.renderCurrentViewPreservingSidebar();
    }
    return true;
  };
  TPP.renderCoverTextFieldDialog = function (location) {
    const list = document.getElementById("frontCoverFieldDialogList");
    const title = document.getElementById("frontCoverFieldDialogTitle");
    const note = document.getElementById("frontCoverFieldDialogNote");
    const nameInput = document.getElementById("frontCoverFieldDialogCustomName");
    const valueInput = document.getElementById(
      "frontCoverFieldDialogCustomValue",
    );
    if (!list) return;
    const targetLocation =
      location === "back" || location === "front" || location === "spine"
        ? location
        : TPP.frontCoverFieldDialogLocation || "front";
    TPP.frontCoverFieldDialogLocation = targetLocation;
    if (title) {
      title.textContent =
        targetLocation === "back"
          ? "Add Back Cover Text"
          : targetLocation === "spine"
            ? "Add Spine Text"
            : "Add Front Cover Text";
    }
    if (note) {
      note.textContent =
        targetLocation === "back"
          ? "Choose another field from Book Info to place on the back cover."
          : targetLocation === "spine"
            ? "Choose another field from Book Info to place on the spine."
            : "Choose another field from Book Info to place on the front cover.";
    }
    const options = TPP.textElementFieldPickerOptions(
      TPP.active,
      targetLocation,
    );
    list.innerHTML = options.length
      ? options
          .map(function (option) {
            const preview = TPP.bookInfoFieldValue(TPP.active, option.value, {
              location: targetLocation,
            });
            return (
              '<button type="button" class="front-cover-field-option" data-cover-text-field="' +
              TPP.esc(option.value) +
              '"><span><strong>' +
              TPP.esc(option.label) +
              "</strong><p>" +
              TPP.esc(preview || "Empty value") +
              "</p></span><span>Add</span></button>"
            );
          })
          .join("")
      : '<div class="front-cover-field-empty">All current Book Info fields are already on the ' +
        TPP.esc(
          targetLocation === "back"
            ? "back cover"
            : targetLocation === "spine"
              ? "spine"
              : "front cover",
        ) +
        ".</div>";
    if (nameInput) nameInput.value = "";
    if (valueInput) valueInput.value = "";
  };
  TPP._openCoverTextFieldDialog = function (location) {
    const dialog = document.getElementById("frontCoverFieldDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    TPP.renderCoverTextFieldDialog(location);
    if (!dialog.open) dialog.showModal();
  };
  const dialog = document.getElementById("frontCoverFieldDialog");
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close("cancel");
        return;
      }
      const closeButton = e.target.closest("[data-action='cancel']");
      if (closeButton && dialog.open) {
        dialog.close("cancel");
        return;
      }
      const option = e.target.closest("[data-cover-text-field]");
      if (option) {
        TPP.sync("nosave");
        TPP.addTextElement(
          TPP.active,
          TPP.frontCoverFieldDialogLocation || "front",
          option.dataset.coverTextField,
        );
        TPP.save("draft", TPP.bookId(TPP.active));
        if (dialog.open) dialog.close("selected");
        TPP.loadForm();
        if (typeof TPP.renderCurrentViewPreservingSidebar === "function") {
          TPP.renderCurrentViewPreservingSidebar();
        }
        return;
      }
      const customAdd = e.target.closest("#frontCoverFieldDialogCustomAdd");
      if (customAdd) addCustomFieldToTextList();
    });
    dialog.addEventListener("keydown", function (e) {
      const target = e.target;
      if (
        e.key === "Enter" &&
        target &&
        (target.id === "frontCoverFieldDialogCustomName" ||
          target.id === "frontCoverFieldDialogCustomValue")
      ) {
        e.preventDefault();
        addCustomFieldToTextList();
      }
    });
  }
  return { open: TPP._openCoverTextFieldDialog };
}
