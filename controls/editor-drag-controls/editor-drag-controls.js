let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  let dragState = null;
  let dragHandleArmedId = "";
  let pendingTextReorderRefresh = false;
  let pendingTextReorderRefreshTimer = 0;

  const clearMarkers = function (controls) {
    controls
      .querySelectorAll(".drag-drop-before, .drag-drop-after")
      .forEach(function (node) {
        node.classList.remove("drag-drop-before", "drag-drop-after");
      });
  };
  const setDragPreviewLabel = function (item) {
    const label = TPP.dragPreviewEl?.querySelector(".drag-preview-label");
    if (!label) return;
    const source =
      item?.querySelector("td:first-child, .toolbar strong, strong") || item;
    const text = (source?.textContent || "")
      .replace(/⋮+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    label.textContent = text || "Dragging item";
  };
  const setTextTrashVisibility = function (location, active) {
    ["frontCoverTrashDrop", "backCoverTrashDrop", "spineTextTrashDrop"].forEach(
      function (id) {
        const dropZone = document.getElementById(id);
        if (!dropZone) return;
        const isTarget =
          (location === "front" && id === "frontCoverTrashDrop") ||
          (location === "back" && id === "backCoverTrashDrop") ||
          (location === "spine" && id === "spineTextTrashDrop");
        dropZone.classList.toggle("is-visible", !!active && isTarget);
        if (!active || !isTarget) dropZone.classList.remove("is-over");
        dropZone.setAttribute(
          "aria-hidden",
          active && isTarget ? "false" : "true",
        );
      },
    );
  };

  return {
    handleMouseDown(event) {
      const handle = event.target.closest("[data-drag-handle]");
      if (!handle) {
        dragHandleArmedId = "";
        return false;
      }
      const item = handle.closest("[data-drag-kind]");
      dragHandleArmedId =
        (item && (item.dataset.textId || item.dataset.itemId)) || "";
      return false;
    },
    handleDragStart(event, controls) {
      const item = event.target.closest("[data-drag-kind]");
      const itemId = item && (item.dataset.textId || item.dataset.itemId || "");
      if (!item || !itemId || itemId !== dragHandleArmedId) {
        event.preventDefault();
        return true;
      }
      dragState = {
        kind: item.dataset.dragKind,
        location: item.dataset.location || "",
        itemId: item.dataset.textId || item.dataset.itemId || "",
        targetId: "",
        beforeTarget: true,
      };
      item.classList.add("is-dragging");
      setDragPreviewLabel(item);
      setTextTrashVisibility(
        dragState.location,
        dragState.kind === "text-element" &&
          (dragState.location === "front" ||
            dragState.location === "back" ||
            dragState.location === "spine"),
      );
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", dragState.itemId);
        if (TPP.dragPreviewEl)
          event.dataTransfer.setDragImage(TPP.dragPreviewEl, 18, 14);
      }
      return true;
    },
    handleDragOver(event, controls) {
      if (!dragState) return false;
      const trashTarget = event.target.closest(
        "#frontCoverTrashDrop, #backCoverTrashDrop, #spineTextTrashDrop",
      );
      if (
        trashTarget &&
        dragState.kind === "text-element" &&
        (dragState.location === "front" ||
          dragState.location === "back" ||
          dragState.location === "spine")
      ) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        trashTarget.classList.add("is-over");
        return true;
      }
      const target = event.target.closest("[data-drag-kind]");
      if (!target || target.classList.contains("is-dragging")) return false;
      const sameKind = target.dataset.dragKind === dragState.kind;
      const sameLocation =
        dragState.kind !== "text-element" ||
        (target.dataset.location || "") === dragState.location;
      if (!sameKind || !sameLocation) return false;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      const rect = target.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      clearMarkers(controls);
      target.classList.add(before ? "drag-drop-before" : "drag-drop-after");
      dragState.targetId = target.dataset.textId || target.dataset.itemId || "";
      dragState.beforeTarget = before;
      return true;
    },
    handleDragLeave(event) {
      const trashTarget = event.target.closest(
        "#frontCoverTrashDrop, #backCoverTrashDrop, #spineTextTrashDrop",
      );
      if (!trashTarget) return false;
      trashTarget.classList.remove("is-over");
      return true;
    },
    handleDrop(event, controls) {
      if (!dragState) return false;
      const trashTarget = event.target.closest(
        "#frontCoverTrashDrop, #backCoverTrashDrop, #spineTextTrashDrop",
      );
      if (
        trashTarget &&
        dragState.kind === "text-element" &&
        (dragState.location === "front" ||
          dragState.location === "back" ||
          dragState.location === "spine")
      ) {
        event.preventDefault();
        clearMarkers(controls);
        const dragging = controls.querySelector(".is-dragging");
        if (dragging) dragging.classList.remove("is-dragging");
        TPP.sync("nosave");
        TPP.removeTextElement(TPP.active, dragState.itemId);
        TPP.save();
        setTextTrashVisibility(dragState.location, false);
        if (TPP.renderTextElementControls) TPP.renderTextElementControls();
        TPP.renderCurrentViewPreservingSidebar();
        dragState = null;
        pendingTextReorderRefresh = false;
        return true;
      }
      event.preventDefault();
      const markerTarget = controls.querySelector(
        ".drag-drop-before, .drag-drop-after",
      );
      const markerTargetId = markerTarget
        ? markerTarget.dataset.textId || markerTarget.dataset.itemId || ""
        : "";
      const markerBefore = markerTarget
        ? markerTarget.classList.contains("drag-drop-before")
        : true;
      clearMarkers(controls);
      const dragging = controls.querySelector(".is-dragging");
      if (dragging) dragging.classList.remove("is-dragging");
      if (
        dragState.kind === "text-element" &&
        markerTargetId &&
        TPP.moveTextElementToTarget
      ) {
        TPP.sync("nosave");
        TPP.moveTextElementToTarget(
          TPP.active,
          dragState.itemId,
          markerTargetId,
          markerBefore,
        );
        TPP.save();
        pendingTextReorderRefresh = true;
        setTextTrashVisibility(dragState.location, false);
        dragState = null;
        return true;
      }
      TPP.sync("commit");
      TPP.renderAll();
      setTextTrashVisibility(dragState.location, false);
      dragState = null;
      return true;
    },
    handleDragEnd(controls) {
      clearMarkers(controls);
      const dragging = controls.querySelector(".is-dragging");
      if (dragging) dragging.classList.remove("is-dragging");
      setTextTrashVisibility(dragState && dragState.location, false);
      dragState = null;
      dragHandleArmedId = "";
      if (pendingTextReorderRefresh) {
        pendingTextReorderRefresh = false;
        if (pendingTextReorderRefreshTimer) {
          window.clearTimeout(pendingTextReorderRefreshTimer);
        }
        pendingTextReorderRefreshTimer = window.setTimeout(function () {
          pendingTextReorderRefreshTimer = 0;
          if (TPP.renderTextElementControls) TPP.renderTextElementControls();
          TPP.renderAll();
        }, 80);
      }
      return true;
    },
  };
}
