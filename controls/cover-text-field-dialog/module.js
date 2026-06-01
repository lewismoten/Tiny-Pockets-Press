let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openCoverTextFieldDialog };
  initialized = true;
  TPP.renderCoverTextFieldDialog = function (location) {
    const list = document.getElementById("frontCoverFieldDialogList");
    const title = document.getElementById("frontCoverFieldDialogTitle");
    const note = document.getElementById("frontCoverFieldDialogNote");
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
      if (!option) return;
      TPP.sync("nosave");
      TPP.addTextElement(
        TPP.active,
        TPP.frontCoverFieldDialogLocation || "front",
        option.dataset.coverTextField,
      );
      TPP.save();
      if (dialog.open) dialog.close("selected");
      TPP.loadForm();
      if (typeof TPP.renderCurrentViewPreservingSidebar === "function") {
        TPP.renderCurrentViewPreservingSidebar();
      }
    });
  }
  return { open: TPP._openCoverTextFieldDialog };
}
