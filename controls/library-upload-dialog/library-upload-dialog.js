let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openLibraryUploadDialog };
  initialized = true;
  const dialog = document.getElementById("libraryUploadDialog");
  const input = document.getElementById("importJson");
  TPP._openLibraryUploadDialog = function () {
    if (!input) return;
    input.value = "";
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  };
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) dialog.close("cancel");
      const closeButton = e.target.closest("[data-action='cancel']");
      if (closeButton) dialog.close("cancel");
    });
  }
  if (input) {
    input.onchange = async function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (dialog && dialog.open) dialog.close("selected");
      const reader = new FileReader();
      reader.onload = async function () {
        const payload = TPP.unwrapImportPayload(JSON.parse(reader.result));
        await TPP.processImportPayload(payload);
      };
      reader.readAsText(file);
    };
  }
  return { open: TPP._openLibraryUploadDialog };
}
