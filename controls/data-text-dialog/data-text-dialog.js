let initialized = false;

export async function init(TPP) {
  if (initialized) return { open: TPP._openDataTextPreview };
  initialized = true;
  const dialog = document.getElementById("dataTextDialog");
  const heading = document.getElementById("dataTextTitle");
  const pre = document.getElementById("dataTextBody");
  TPP._openDataTextPreview = function (title, body, mode) {
    if (!dialog || !heading || !pre || typeof dialog.showModal !== "function")
      return;
    heading.textContent = title || "Data Preview";
    pre.textContent = body || "";
    pre.className = mode === "hex" ? "data-code data-code-hex" : "data-code";
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
  return { open: TPP._openDataTextPreview };
}
