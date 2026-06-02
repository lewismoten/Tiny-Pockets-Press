let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const list = event.target.closest("#chapterList");
      if (!list) return false;
      const row = event.target.closest("[data-i]");
      if (row) {
        event.preventDefault();
        TPP.sync();
        TPP.currentChapter = Number(row.dataset.i);
        TPP.renderAll();
        return true;
      }
      return false;
    },
    handleDragStart(event) {
      const row = event.target.closest("#chapterList [data-i]");
      if (!row) return false;
      TPP.sync();
      const sourceIndex = Number(row.dataset.i);
      TPP.chapterDragState = {
        sourceIndex: sourceIndex,
        targetIndex: sourceIndex,
        position: "after",
        level: Math.max(
          0,
          Number(TPP.active.chapters[sourceIndex]?.level) || 0,
        ),
      };
      row.classList.add("dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", row.dataset.i);
      }
      if (TPP.applyChapterDropState) TPP.applyChapterDropState();
      return true;
    },
    handleDragOver(event) {
      const list = event.target.closest("#chapterList");
      const row = event.target.closest("#chapterList [data-i]");
      if (!list || !TPP.chapterDragState) return false;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      let requestedLevel = 0;
      if (row) {
        const rect = row.getBoundingClientRect();
        TPP.chapterDragState.targetIndex = Number(row.dataset.i);
        TPP.chapterDragState.position =
          event.clientY < rect.top + rect.height / 2 ? "before" : "after";
        requestedLevel = TPP.chapterDropLevelFromEvent(
          list,
          event,
          row,
          TPP.chapterDragState.position,
        );
      } else {
        TPP.chapterDragState.targetIndex = Math.max(
          0,
          (TPP.active.chapters || []).length - 1,
        );
        TPP.chapterDragState.position = "after";
        requestedLevel = TPP.chapterDropLevelFromEvent(list, event, null, "after");
      }
      TPP.chapterDragState.level = TPP.chapterAllowedDropLevel(
        TPP.active.chapters,
        TPP.chapterDragState.sourceIndex,
        TPP.chapterDragState.targetIndex,
        TPP.chapterDragState.position,
        requestedLevel,
      );
      if (TPP.applyChapterDropState) TPP.applyChapterDropState();
      return true;
    },
    handleDrop(event) {
      const list = event.target.closest("#chapterList");
      const row = event.target.closest("#chapterList [data-i]");
      if (!list || !TPP.chapterDragState) return false;
      event.preventDefault();
      const targetIndex = row
        ? Number(row.dataset.i)
        : Math.max(0, (TPP.active.chapters || []).length - 1);
      const result = TPP.moveChapterBlock(
        TPP.active.chapters,
        TPP.chapterDragState.sourceIndex,
        targetIndex,
        TPP.chapterDragState.position,
        TPP.chapterDragState.level,
      );
      if (result) {
        TPP.active.chapters = result.chapters;
        TPP.currentChapter = result.currentChapter;
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.clearChapterDropState();
        TPP.renderAll();
        return true;
      }
      TPP.clearChapterDropState();
      if (TPP.applyChapterDropState) TPP.applyChapterDropState();
      return true;
    },
    handleDragEnd() {
      if (!TPP.chapterDragState) return false;
      TPP.clearChapterDropState();
      if (TPP.applyChapterDropState) TPP.applyChapterDropState();
      return true;
    },
  };
}
