let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  return {
    handleClick(event) {
      const list = event.target.closest("#chapterList");
      if (!list) return false;
      const row = event.target.closest("[data-i]");
      if (!row) return false;
      event.preventDefault();
      TPP.sync();
      const index = Number(row.dataset.i);
      const action = event.target.dataset.act;
      if (action === "select") TPP.currentChapter = index;
      else if (action === "up" && index > 0) {
        [TPP.active.chapters[index - 1], TPP.active.chapters[index]] = [
          TPP.active.chapters[index],
          TPP.active.chapters[index - 1],
        ];
        TPP.currentChapter = index - 1;
      } else if (action === "down" && index < TPP.active.chapters.length - 1) {
        [TPP.active.chapters[index + 1], TPP.active.chapters[index]] = [
          TPP.active.chapters[index],
          TPP.active.chapters[index + 1],
        ];
        TPP.currentChapter = index + 1;
      } else if (action === "indent") {
        TPP.active.chapters[index].level = Math.min(
          6,
          (TPP.active.chapters[index].level || 0) + 1,
        );
      } else if (action === "outdent") {
        TPP.active.chapters[index].level = Math.max(
          0,
          (TPP.active.chapters[index].level || 0) - 1,
        );
      }
      TPP.save();
      TPP.renderAll();
      return true;
    },
  };
}
