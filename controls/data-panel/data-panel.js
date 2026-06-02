let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;
  const dataPanel = document.getElementById("dataPanel");
  const dataSidebar = document.getElementById("dataSidebar");
  if (dataPanel) {
    dataPanel.addEventListener("click", function (e) {
      const chip = e.target.closest("[data-image-src]");
      if (chip) {
        TPP.openDataImagePreview(
          chip.dataset.imageSrc || "",
          chip.dataset.imageTitle || "Image Preview",
        );
        return;
      }
      const viewButton = e.target.closest("[data-data-view]");
      if (viewButton) {
        TPP.openDataPreviewById(viewButton.dataset.dataView || "");
        return;
      }
      const hexButton = e.target.closest("[data-data-hex]");
      if (hexButton) {
        TPP.openDataPreviewById(hexButton.dataset.dataHex || "");
        return;
      }
      const bytesLabel = e.target.closest("[data-bytes]");
      if (bytesLabel) {
        TPP.toast(bytesLabel.dataset.bytes || "");
        return;
      }
      const copyJson = e.target.closest("[data-copy-json]");
      if (copyJson) {
        navigator.clipboard
          .writeText(JSON.stringify(TPP.active, null, 2))
          .then(function () {
            TPP.toast("JSON copied to clipboard");
          })
          .catch(function () {
            TPP.toast("Unable to copy JSON");
          });
        return;
      }
      const expandAll = e.target.closest("[data-json-expand-all]");
      if (expandAll) {
        const tree = dataPanel.querySelector('[data-json-tree="raw"]');
        if (tree) {
          tree.querySelectorAll("details.json-node").forEach(function (node) {
            node.open = true;
          });
        }
        return;
      }
      const collapseAll = e.target.closest("[data-json-collapse-all]");
      if (collapseAll) {
        const tree = dataPanel.querySelector('[data-json-tree="raw"]');
        if (tree) {
          tree.querySelectorAll("details.json-node").forEach(function (node) {
            node.open = false;
          });
        }
        return;
      }
      const remove = e.target.closest("[data-stale-remove]");
      if (remove) {
        TPP.removeStaleDataEntry(remove.dataset.staleRemove || "");
        return;
      }
      const removeAll = e.target.closest("[data-stale-remove-all]");
      if (removeAll) TPP.removeAllStaleDataEntries();
    });
  }
  if (dataSidebar) {
    dataSidebar.addEventListener("click", function (e) {
      const tabButton = e.target.closest("[data-data-tab]");
      if (!tabButton) return;
      TPP.writeDataTab(tabButton.dataset.dataTab || "top");
      TPP.renderData();
    });
  }
  return {};
}
