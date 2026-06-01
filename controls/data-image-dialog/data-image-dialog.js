let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openDataImagePreview };
  initialized = true;
  const dialog = document.getElementById("dataImageDialog");
  const image = document.getElementById("dataImagePreview");
  const heading = document.getElementById("dataImageTitle");
  TPP._openDataImagePreview = function (src, title) {
    if (!dialog || !image || !heading || typeof dialog.showModal !== "function")
      return;
    image.src = src || "";
    heading.textContent = title || "Image Preview";
    if (!dialog.open) dialog.showModal();
  };
  if (dialog) {
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close();
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && dialog.open) dialog.close();
    });
  }
  return { open: TPP._openDataImagePreview };
}
