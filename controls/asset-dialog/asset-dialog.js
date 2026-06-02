let initialized = false;

export async function init(TPP) {
  if (initialized) {
    return {
      open: TPP._openAssetDialog,
      close: TPP._closeAssetDialog,
      render: TPP._renderAssetDialog,
    };
  }
  initialized = true;
  TPP._renderAssetDialog = function () {
    const dialog = document.getElementById("assetDialog");
    const title = document.getElementById("assetDialogTitle");
    const text = document.getElementById("assetDialogText");
    const list = document.getElementById("assetDialogList");
    const clearButton = document.getElementById("assetClearButton");
    if (!dialog || !title || !text || !list) return;
    const target = TPP.Assets ? TPP.Assets.dialogTarget : TPP.assetDialogTarget;
    const spec =
      target && TPP.Assets && typeof TPP.Assets.targetSpec === "function"
        ? TPP.Assets.targetSpec(target.type, target.key)
        : target
          ? TPP.assetTargetSpec(target.type, target.key)
          : null;
    const currentId = target
      ? TPP.Assets && typeof TPP.Assets.targetValue === "function"
        ? TPP.Assets.targetValue(target.type, target.key)
        : TPP.assetTargetValue(target.type, target.key)
      : "";
    title.textContent = spec ? spec.label : "Choose Image";
    text.textContent = spec
      ? "Reuse an existing image, upload a new one, or remove the current assignment."
      : "";
    if (clearButton) clearButton.disabled = !currentId;
    const files = TPP.filePickerAssets
      ? TPP.filePickerAssets(TPP.active)
      : TPP.active && Array.isArray(TPP.active.files)
        ? TPP.active.files
        : [];
    list.innerHTML = files.length
      ? files
          .map(function (file) {
            return TPP.Assets && typeof TPP.Assets.cardHtml === "function"
              ? TPP.Assets.cardHtml(file, currentId)
              : TPP.assetCardHtml(file, currentId);
          })
          .join("")
      : '<div class="asset-empty">No images have been uploaded for this book yet.</div>';
  };
  TPP._openAssetDialog = function (targetType, targetKey) {
    const dialog = document.getElementById("assetDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    TPP.sync("nosave");
    if (TPP.Assets) {
      TPP.Assets.dialogTarget = { type: targetType, key: targetKey };
    } else {
      TPP.assetDialogTarget = { type: targetType, key: targetKey };
    }
    TPP._renderAssetDialog();
    if (!dialog.open) dialog.showModal();
  };
  TPP._closeAssetDialog = function () {
    const dialog = document.getElementById("assetDialog");
    if (dialog && dialog.open) dialog.close();
  };
  const dialog = document.getElementById("assetDialog");
  const uploadButton = document.getElementById("assetUploadButton");
  const uploadInput = document.getElementById("assetUploadInput");
  const clearButton = document.getElementById("assetClearButton");
  if (dialog) {
    dialog.addEventListener("close", function () {
      if (TPP.Assets) TPP.Assets.dialogTarget = null;
      else TPP.assetDialogTarget = null;
    });
    dialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dialog && !card && dialog.open) {
        dialog.close();
        return;
      }
      const useButton = e.target.closest("[data-asset-use]");
      if (useButton) {
        if (
          TPP.Assets &&
          typeof TPP.Assets.assignToCurrentTarget === "function"
        ) {
          TPP.Assets.assignToCurrentTarget(useButton.dataset.assetUse || "");
        } else {
          TPP.assignAssetToCurrentTarget(useButton.dataset.assetUse || "");
        }
        return;
      }
      const deleteButton = e.target.closest("[data-asset-delete]");
      if (deleteButton) {
        if (TPP.Assets && typeof TPP.Assets.delete === "function") {
          TPP.Assets.delete(deleteButton.dataset.assetDelete || "");
        } else {
          TPP.deleteAsset(deleteButton.dataset.assetDelete || "");
        }
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && dialog.open) dialog.close();
    });
  }
  if (uploadButton && uploadInput) {
    uploadButton.onclick = function () {
      uploadInput.value = "";
      uploadInput.click();
    };
    uploadInput.onchange = function (e) {
      TPP.file(e, function (data, file) {
        if (
          TPP.Assets &&
          typeof TPP.Assets.uploadToCurrentTarget === "function"
        ) {
          TPP.Assets.uploadToCurrentTarget(data, file);
        } else {
          TPP.uploadAssetToCurrentTarget(data, file);
        }
        uploadInput.value = "";
      });
    };
  }
  if (clearButton) {
    clearButton.onclick = function () {
      if (
        TPP.Assets &&
        typeof TPP.Assets.assignToCurrentTarget === "function"
      ) {
        TPP.Assets.assignToCurrentTarget("");
      } else {
        TPP.assignAssetToCurrentTarget("");
      }
    };
  }
  return {
    open: TPP._openAssetDialog,
    close: TPP._closeAssetDialog,
    render: TPP._renderAssetDialog,
  };
}
