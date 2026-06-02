let initialized = false;

export async function init(TPP) {
  if (initialized) return {};
  initialized = true;

  const addChapter = function () {
    TPP.sync();
    const chapters = Array.isArray(TPP.active.chapters) ? TPP.active.chapters : [];
    const selectedIndex = Math.max(
      0,
      Math.min(Number(TPP.currentChapter) || 0, Math.max(0, chapters.length - 1)),
    );
    const selectedChapter = chapters[selectedIndex] || null;
    const selectedLevel = Math.max(
      0,
      Math.min(5, Number(selectedChapter && selectedChapter.level) || 0),
    );
    const selectedRange = chapters.length
      ? TPP.chapterBlockRange(chapters, selectedIndex)
      : { end: 0 };
    const hasChildren = selectedRange.end > selectedIndex + 1;
    const previousSibling =
      chapters[selectedIndex - 1] &&
      Math.max(0, Number(chapters[selectedIndex - 1].level) || 0) ===
        selectedLevel;
    const nextSibling =
      chapters[selectedRange.end] &&
      Math.max(0, Number(chapters[selectedRange.end].level) || 0) ===
        selectedLevel;
    const addAsChild =
      selectedLevel < 5 &&
      (Boolean(previousSibling) || Boolean(nextSibling) || hasChildren);
    const insertAt = chapters.length ? selectedRange.end : 0;
    const newLevel = addAsChild ? selectedLevel + 1 : selectedLevel;
    const newChapter = {
      id: TPP.internalId("c"),
      title: "New Chapter",
      tocTitle: "",
      text: "",
      imageId: "",
      imageElementId: "",
      level: newLevel,
      isMetadata: false,
      includeInToc: true,
    };
    chapters.splice(insertAt, 0, newChapter);
    if (TPP.migrateImageElements) {
      TPP.migrateImageElements(TPP.active, TPP.fallbackBook());
    }
    if (TPP.syncLegacyImageFieldsFromElements) {
      TPP.syncLegacyImageFieldsFromElements(TPP.active);
    }
    TPP.currentChapter = addAsChild ? selectedIndex : insertAt;
    TPP.save("draft", TPP.bookId(TPP.active));
    TPP.renderAll();
  };

  return {
    handleInput(event) {
      const editor = event.target.closest("#chapterEditor");
      if (!editor) return false;
      const card = event.target.closest(".chapter-card");
      if (!card) return false;
      if (
        event.target.classList.contains("chapter-metadata") &&
        event.target.checked
      ) {
        const textarea = card.querySelector(".chapter-text");
        if (textarea && !textarea.value.trim()) {
          textarea.value = '{\n  "type": "blank",\n  "pages": 12\n}';
        }
      }
      TPP.sync("draft");
      const preview = card.querySelector(".md-preview");
      const textarea = card.querySelector(".chapter-text");
      if (preview && textarea) {
        preview.innerHTML = card.querySelector(".chapter-metadata").checked
          ? TPP.metadataPreview(textarea.value)
          : TPP.previewWithBreaks(textarea.value);
        TPP.renderQr(preview);
      }
      TPP.renderChapterList();
      return true;
    },
    handleChange(event) {
      const editor = event.target.closest("#chapterEditor");
      if (!editor) return false;
      const card = event.target.closest(".chapter-card");
      if (!card) return false;
      TPP.sync("draft");
      TPP.renderAll();
      return true;
    },
    handleClick(event) {
      const addButton = event.target.closest("#addChapter");
      if (addButton) {
        event.preventDefault();
        addChapter();
        return true;
      }

      const editor = event.target.closest("#chapterEditor");
      if (!editor) return false;

      const fmt = event.target.dataset.fmt;
      if (fmt) {
        event.preventDefault();
        const textarea = document.querySelector(".chapter-text");
        const map = {
          bold: ["**", "**"],
          italic: ["*", "*"],
          underline: ["<u>", "</u>"],
          strike: ["~~", "~~"],
          ul: ["- ", ""],
          h2: ["## ", ""],
          table: ["\n| A | B |\n|---|---|\n| 1 | 2 |\n", ""],
        };
        const pair = map[fmt];
        if (!textarea || !pair) return true;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value =
          textarea.value.slice(0, start) +
          pair[0] +
          textarea.value.slice(start, end) +
          pair[1] +
          textarea.value.slice(end);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
        return true;
      }

      const main = event.target.dataset.main;
      if (main === "remove" && TPP.active.chapters.length > 1) {
        event.preventDefault();
        TPP.sync();
        const card = event.target.closest(".chapter-card");
        const removeIndex = Math.max(
          0,
          Math.min(
            Number(card && card.dataset.index),
            TPP.active.chapters.length - 1,
          ),
        );
        TPP.active.chapters.splice(removeIndex, 1);
        TPP.currentChapter = Math.min(
          removeIndex,
          TPP.active.chapters.length - 1,
        );
        TPP.save("draft", TPP.bookId(TPP.active));
        TPP.renderAll();
        return true;
      }

      if (main === "read") {
        event.preventDefault();
        const pages = TPP.buildPages();
        const chapter = TPP.active.chapters[TPP.currentChapter];
        TPP.readerIndex = Math.max(
          0,
          pages.findIndex(function (p) {
            return (
              chapter &&
              chapter.id &&
              p &&
              p.chapterId &&
              p.chapterId === chapter.id
            );
          }),
        );
        TPP.switchView("reader");
        return true;
      }

      const assetButton = event.target.closest(".asset-picker-open");
      if (assetButton) {
        event.preventDefault();
        TPP.openAssetDialog(
          assetButton.dataset.targetType,
          assetButton.dataset.targetKey,
        );
        return true;
      }

      return false;
    },
  };
}
