document.addEventListener("DOMContentLoaded", async function () {
  TPP.populate();
  await TPP.load();
  await TPP.loadStaleKeyLookup();
  TPP.view = TPP.initialView();
  if (!window.location.hash) history.replaceState(null, "", "#" + TPP.view);
  TPP.loadForm();
  TPP.restoreSettingsUi();
  TPP.switchView(TPP.view, true);
  TPP.bindSettingsUiPersistence();

  document.querySelectorAll(".tab").forEach(function (button) {
    button.onclick = function () {
      TPP.switchView(button.dataset.view);
    };
  });

  TPP.fields.forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.oninput = function () {
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize")
        document.querySelector(".customSize").hidden =
          document.getElementById("pageSize").value !== "custom";
      TPP.sync("draft");
      TPP.renderAll();
    };
    el.onchange = function () {
      if (id === "paperPreset") {
        const p = TPP.papers[document.getElementById("paperPreset").value];
        document.getElementById("pageBg").value = p[1];
        document.getElementById("pageText").value = p[2];
      }
      if (id === "pageSize")
        document.querySelector(".customSize").hidden =
          document.getElementById("pageSize").value !== "custom";
      TPP.sync("commit");
      TPP.renderAll();
    };
  });
  const controls = document.querySelector(".controls");
  if (controls) {
    controls.addEventListener("input", function (e) {
      if (!e.target.closest(".text-element-group")) return;
      TPP.sync("draft");
      TPP.renderAll();
    });
    controls.addEventListener("change", function (e) {
      if (!e.target.closest(".text-element-group")) return;
      TPP.sync("commit");
      TPP.renderAll();
    });
  }

  ["coverImageSlot", "backImageSlot", "spineImageSlot"].forEach(function (id) {
    const node = document.getElementById(id);
    if (!node) return;
    node.onclick = function (e) {
      const button = e.target.closest(".asset-picker-open");
      if (!button) return;
      TPP.openAssetDialog(button.dataset.targetType, button.dataset.targetKey);
    };
  });

  document.getElementById("chapterList").onclick = function (e) {
    const row = e.target.closest("[data-i]");
    if (!row) return;
    TPP.sync();
    const index = Number(row.dataset.i);
    const action = e.target.dataset.act;
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
  };

  document.getElementById("chapterEditor").oninput = function (e) {
    const card = e.target.closest(".chapter-card");
    if (!card) return;
    if (e.target.classList.contains("chapter-metadata") && e.target.checked) {
      const textarea = card.querySelector(".chapter-text");
      if (textarea && !textarea.value.trim())
        textarea.value = '{\n  "type": "blank",\n  "pages": 12\n}';
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
  };
  document
    .getElementById("chapterEditor")
    .addEventListener("change", function (e) {
      const card = e.target.closest(".chapter-card");
      if (!card) return;
      TPP.sync("commit");
      TPP.renderAll();
    });

  document.getElementById("chapterEditor").onclick = function (e) {
    const fmt = e.target.dataset.fmt;
    if (fmt) {
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
    }
    const main = e.target.dataset.main;
    if (main === "remove" && TPP.active.chapters.length > 1) {
      TPP.sync();
      const card = e.target.closest(".chapter-card");
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
      TPP.save();
      TPP.renderAll();
    }
    if (main === "read") {
      const pages = TPP.buildPages();
      const title = TPP.active.chapters[TPP.currentChapter].title;
      TPP.readerIndex = Math.max(
        0,
        pages.findIndex(function (p) {
          return p.html.includes(TPP.esc(title));
        }),
      );
      TPP.switchView("reader");
    }
    const assetButton = e.target.closest(".asset-picker-open");
    if (assetButton) {
      TPP.openAssetDialog(
        assetButton.dataset.targetType,
        assetButton.dataset.targetKey,
      );
    }
  };

  document.getElementById("addChapter").onclick = function () {
    TPP.sync();
    TPP.active.chapters.push({
      id: TPP.uid(),
      title: "New Chapter",
      tocTitle: "",
      text: "",
      imageId: "",
      imageElementId: "",
      imagePlacement: "none",
      imageZoom: 70,
      imageRotate: 0,
      level: 0,
      isSubsection: false,
      isMetadata: false,
      includeInToc: true,
    });
    if (TPP.migrateImageElements)
      TPP.migrateImageElements(TPP.active, TPP.fallbackBook());
    if (TPP.syncLegacyImageFieldsFromElements)
      TPP.syncLegacyImageFieldsFromElements(TPP.active);
    TPP.currentChapter = TPP.active.chapters.length - 1;
    TPP.save();
    TPP.renderAll();
  };

  document.getElementById("newBook").onclick = function () {
    const book = TPP.norm(TPP.fallbackBook());
    book.title = "Untitled Tiny Book";
    book.chapters = [
      {
        id: TPP.uid(),
        title: "New Chapter",
        tocTitle: "",
        text: "",
        imageId: "",
        imageElementId: "",
        imagePlacement: "none",
        imageZoom: 70,
        imageRotate: 0,
        level: 0,
        isSubsection: false,
        isMetadata: false,
        includeInToc: true,
      },
    ];
    if (TPP.migrateImageElements)
      TPP.migrateImageElements(book, TPP.fallbackBook());
    if (TPP.syncLegacyImageFieldsFromElements)
      TPP.syncLegacyImageFieldsFromElements(book);
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  document.getElementById("duplicateBook").onclick = function () {
    TPP.sync();
    const name = prompt(
      "Title for duplicated book:",
      "Copy of " + TPP.active.title,
    );
    if (name === null) return;
    const stamp = TPP.nowIso();
    const book = TPP.bookDescendant(
      TPP.active,
      {
        id: TPP.uid(),
        title: name || "Copy of " + TPP.active.title,
      },
      "copy",
      stamp,
    );
    TPP.library.push(book);
    TPP.save();
    TPP.setActive(book);
  };

  document.getElementById("deleteBook").onclick = function () {
    if (TPP.library.length <= 1) return alert("Keep at least one book.");
    if (confirm("Delete this book?")) {
      TPP.library = TPP.library.filter(function (book) {
        return TPP.bookId(book) !== TPP.bookId(TPP.active);
      });
      TPP.save();
      TPP.setActive(TPP.library[0]);
    }
  };

  TPP.readerGoPrev = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    TPP.readerIndex = TPP.readerNormalizeIndex(
      TPP.readerIndex - (mode === "spread" ? 2 : 1),
      pages,
      mode,
      settings,
    );
    TPP.renderReader();
  };
  document.getElementById("readerStagePrev").onclick = TPP.readerGoPrev;
  TPP.readerGoNext = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    const next =
      mode === "spread" && TPP.readerIndex === 0
        ? 1
        : TPP.readerIndex + (mode === "spread" ? 2 : 1);
    TPP.readerIndex = TPP.readerNormalizeIndex(next, pages, mode, settings);
    TPP.renderReader();
  };
  document.getElementById("readerStageNext").onclick = TPP.readerGoNext;
  document.getElementById("readerJump").onchange = function () {
    TPP.readerIndex = Number(document.getElementById("readerJump").value);
    TPP.renderReader();
  };
  document.getElementById("readerScrub").oninput = function () {
    const pages = TPP.buildPages();
    const mode = document.getElementById("readerMode").value;
    const settings = TPP.settings();
    TPP.readerIndex = TPP.readerNormalizeIndex(
      Number(document.getElementById("readerScrub").value),
      pages,
      mode,
      settings,
    );
    TPP.renderReader();
  };
  document.getElementById("readerMode").onchange = TPP.renderReader;

  document.getElementById("librarySearch").oninput = TPP.renderLibrary;
  document.getElementById("libraryImport").onclick = function () {
    const input = document.getElementById("importJson");
    if (!input) return;
    input.value = "";
    input.click();
  };
  document.getElementById("libraryGrid").onclick = function (e) {
    const button = e.target.closest("[data-act]");
    const card = e.target.closest("[data-id]");
    if (!button || !card) return;
    const book = TPP.library.find(function (b) {
      return TPP.bookId(b) === card.dataset.id;
    });
    if (button.dataset.act === "edit") {
      TPP.setActive(book);
      TPP.switchView("editor");
    }
    if (button.dataset.act === "about") {
      TPP.setActive(book);
      TPP.switchView("about");
    }
    if (button.dataset.act === "view") {
      TPP.setActive(book);
      TPP.switchView("reader");
    }
    if (button.dataset.act === "dup") {
      const name = prompt(
        "Title for duplicated book:",
        "Copy of " + book.title,
      );
      if (name !== null) {
        const stamp = TPP.nowIso();
        const copy = TPP.bookDescendant(
          book,
          {
            id: TPP.uid(),
            title: name || "Copy of " + book.title,
          },
          "copy",
          stamp,
        );
        TPP.library.push(copy);
        TPP.save();
        TPP.renderLibrary();
      }
    }
    if (button.dataset.act === "export") {
      TPP.markBookExported(book);
      TPP.save();
      TPP.download(TPP.bookExportName(book), {
        type: "tiny-pockets-book",
        schemaVersion: TPP.SCHEMA_VERSION,
        book: book,
      });
    }
  };

  document.getElementById("saveBook").onclick = async function () {
    TPP.sync();
    TPP.buildPages();
    await TPP.captureCover();
    TPP.toast("Saved.");
  };
  document.getElementById("exportInteriorPdf").onclick = function () {
    TPP.exportPdfFrom("interior");
  };
  document.getElementById("exportReadablePdf").onclick = function () {
    TPP.exportReadablePdf();
  };
  document.getElementById("exportImagesZip").onclick = function () {
    TPP.openImageExportDialog();
  };
  document.getElementById("exportCoverPdf").onclick = function () {
    TPP.exportPdfFrom("cover");
  };
  document.getElementById("printBrowser").onclick = function () {
    setTimeout(function () {
      print();
    }, 80);
  };
  document.getElementById("exportBook").onclick = function () {
    TPP.sync();
    TPP.markBookExported(TPP.active);
    TPP.save();
    TPP.download(TPP.bookExportName(TPP.active), {
      type: "tiny-pockets-book",
      schemaVersion: TPP.SCHEMA_VERSION,
      book: TPP.active,
    });
  };
  document.getElementById("exportStyle").onclick = function () {
    TPP.sync();
    const out = {
      type: "tiny-pockets-style-v6-1",
      schemaVersion: TPP.SCHEMA_VERSION,
      style: {},
    };
    TPP.styleFields.forEach(function (field) {
      out.style[field] = TPP.active[field];
    });
    TPP.download("tiny-pockets-style.json", out);
  };
  document.getElementById("exportLibrary").onclick = function () {
    const stamp = TPP.nowIso();
    TPP.library.forEach(function (book) {
      TPP.markBookExported(book, stamp);
    });
    TPP.save();
    TPP.download("tiny-pockets-library.json", {
      type: "tiny-pockets-library",
      schemaVersion: TPP.SCHEMA_VERSION,
      books: TPP.library,
    });
  };
  document.getElementById("importJson").onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function () {
      const payload = TPP.unwrapImportPayload(JSON.parse(reader.result));
      if (payload.kind === "library") {
        const stamp = TPP.nowIso();
        for (const rawBook of payload.value) {
          const incoming = TPP.bookImported(rawBook, stamp);
          const existingIndex = TPP.library.findIndex(function (book) {
            return TPP.bookId(book) === TPP.bookId(incoming);
          });
          if (existingIndex < 0) {
            TPP.library.push(incoming);
            continue;
          }
          const existing = TPP.library[existingIndex];
          const action = await TPP.resolveImportConflict(incoming, existing);
          if (action === "merge") {
            TPP.library[existingIndex] = TPP.mergeImportedBook(
              existing,
              incoming,
              stamp,
            );
          } else if (action === "overwrite") {
            TPP.bookMeta(incoming).lastExportedAt =
              TPP.bookLastExportedAt(existing) ||
              TPP.bookLastExportedAt(incoming) ||
              "";
            TPP.library[existingIndex] = incoming;
          } else if (action === "copy") {
            TPP.library.push(
              TPP.bookDescendant(incoming, { id: TPP.uid() }, "import", stamp),
            );
          }
        }
        TPP.save();
        TPP.setActive(TPP.library[0]);
        TPP.switchView("library");
      } else if (payload.kind === "style") {
        Object.entries(payload.value).forEach(function (entry) {
          TPP.active[entry[0]] = entry[1];
        });
        TPP.save();
        TPP.loadForm();
        TPP.renderAll();
      } else {
        const stamp = TPP.nowIso();
        const incoming = TPP.bookImported(payload.value, stamp);
        const existingIndex = TPP.library.findIndex(function (book) {
          return TPP.bookId(book) === TPP.bookId(incoming);
        });
        if (existingIndex < 0) {
          TPP.library.push(incoming);
          TPP.save();
          TPP.setActive(incoming);
        } else {
          const existing = TPP.library[existingIndex];
          const action = await TPP.resolveImportConflict(incoming, existing);
          if (action === "cancel") return;
          if (action === "merge") {
            TPP.library[existingIndex] = TPP.mergeImportedBook(
              existing,
              incoming,
              stamp,
            );
          } else if (action === "overwrite") {
            TPP.bookMeta(incoming).lastExportedAt =
              TPP.bookLastExportedAt(existing) ||
              TPP.bookLastExportedAt(incoming) ||
              "";
            TPP.library[existingIndex] = incoming;
          } else if (action === "copy") {
            const copy = TPP.bookDescendant(
              incoming,
              { id: TPP.uid() },
              "import",
              stamp,
            );
            TPP.library.push(copy);
            TPP.save();
            TPP.setActive(copy);
            return;
          }
          TPP.save();
          TPP.setActive(TPP.library[existingIndex]);
        }
      }
    };
    reader.readAsText(file);
  };

  const assetDialog = document.getElementById("assetDialog");
  const assetUploadButton = document.getElementById("assetUploadButton");
  const assetUploadInput = document.getElementById("assetUploadInput");
  const assetClearButton = document.getElementById("assetClearButton");
  if (assetDialog) {
    assetDialog.addEventListener("close", function () {
      TPP.assetDialogTarget = null;
    });
    assetDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === assetDialog && !card && assetDialog.open) {
        assetDialog.close();
        return;
      }
    });
    assetDialog.addEventListener("click", function (e) {
      const useButton = e.target.closest("[data-asset-use]");
      if (useButton) {
        TPP.assignAssetToCurrentTarget(useButton.dataset.assetUse || "");
        return;
      }
      const deleteButton = e.target.closest("[data-asset-delete]");
      if (deleteButton) {
        TPP.deleteAsset(deleteButton.dataset.assetDelete || "");
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && assetDialog.open) assetDialog.close();
    });
  }
  if (assetUploadButton && assetUploadInput) {
    assetUploadButton.onclick = function () {
      assetUploadInput.value = "";
      assetUploadInput.click();
    };
    assetUploadInput.onchange = function (e) {
      TPP.file(e, function (data, file) {
        TPP.uploadAssetToCurrentTarget(data, file);
        assetUploadInput.value = "";
      });
    };
  }
  if (assetClearButton) {
    assetClearButton.onclick = function () {
      TPP.assignAssetToCurrentTarget("");
    };
  }
  const dataPanel = document.getElementById("dataPanel");
  const dataSidebar = document.getElementById("dataSidebar");
  const dataImageDialog = document.getElementById("dataImageDialog");
  const dataTextDialog = document.getElementById("dataTextDialog");
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
  if (dataImageDialog) {
    dataImageDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dataImageDialog && !card && dataImageDialog.open) {
        dataImageDialog.close();
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && dataImageDialog.open) dataImageDialog.close();
    });
  }
  if (dataTextDialog) {
    dataTextDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === dataTextDialog && !card && dataTextDialog.open) {
        dataTextDialog.close();
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && dataTextDialog.open) dataTextDialog.close();
    });
  }
  const imageExportDialog = document.getElementById("imageExportDialog");
  const imageExportPreset = document.getElementById("imageExportDialogPreset");
  const imageExportDpi = document.getElementById("imageExportDialogDpi");
  const imageExportCustomWrap = document.getElementById(
    "imageExportDialogCustomWrap",
  );
  const imageExportFormat = document.getElementById("imageExportDialogFormat");
  const imageExportColorDepth = document.getElementById(
    "imageExportDialogColorDepth",
  );
  const imageExportQualityWrap = document.getElementById(
    "imageExportDialogQualityWrap",
  );
  const imageExportQuality = document.getElementById(
    "imageExportDialogQuality",
  );
  const imageExportQualityValue = document.getElementById(
    "imageExportDialogQualityValue",
  );
  const imageExportThresholdWrap = document.getElementById(
    "imageExportDialogThresholdWrap",
  );
  const imageExportThreshold = document.getElementById(
    "imageExportDialogThreshold",
  );
  const imageExportThresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  const imageExportEstimate = document.getElementById(
    "imageExportDialogEstimate",
  );
  const imageExportPreviewPrev = document.getElementById(
    "imageExportPreviewPrev",
  );
  const imageExportPreviewNext = document.getElementById(
    "imageExportPreviewNext",
  );
  if (
    imageExportDialog &&
    imageExportPreset &&
    imageExportDpi &&
    imageExportCustomWrap &&
    imageExportFormat &&
    imageExportColorDepth &&
    imageExportQualityWrap &&
    imageExportQuality &&
    imageExportQualityValue &&
    imageExportThresholdWrap &&
    imageExportThreshold &&
    imageExportThresholdValue &&
    imageExportEstimate &&
    imageExportPreviewPrev &&
    imageExportPreviewNext
  ) {
    const presetValues = ["72", "96", "150", "200", "300", "600"];
    const syncPresetUi = function () {
      const preset = imageExportPreset.value;
      imageExportCustomWrap.hidden = preset !== "custom";
      if (preset !== "custom") imageExportDpi.value = preset;
    };
    const syncFormatUi = function () {
      const lossy =
        imageExportFormat.value === "jpeg" ||
        imageExportFormat.value === "webp";
      const colorDepthApplies = ["png", "jpeg", "webp"].includes(
        imageExportFormat.value,
      );
      imageExportQuality.disabled = !lossy;
      imageExportQualityWrap.classList.toggle("is-disabled", !lossy);
      imageExportColorDepth.disabled = !colorDepthApplies;
      imageExportColorDepth.parentElement.classList.toggle(
        "is-disabled",
        !colorDepthApplies,
      );
      const mono = imageExportColorDepth.value === "mono1";
      imageExportThreshold.disabled = !mono;
      imageExportThresholdWrap.classList.toggle("is-disabled", !mono);
      imageExportQualityValue.textContent =
        Math.max(1, Math.min(100, Number(imageExportQuality.value) || 92)) +
        "%";
      imageExportThresholdValue.textContent = String(
        Math.max(0, Math.min(255, Number(imageExportThreshold.value) || 128)),
      );
    };
    const updateEstimate = function () {
      const pixels = TPP.imageExportPixels(Number(imageExportDpi.value) || 300);
      imageExportEstimate.textContent =
        "Estimated size: " +
        pixels.width +
        " × " +
        pixels.height +
        " pixels per page";
    };
    TPP.syncImageExportFormatUi = syncFormatUi;
    TPP.updateImageExportEstimate = updateEstimate;
    const schedulePreview = function () {
      clearTimeout(TPP.imageExportPreviewTimer);
      TPP.imageExportPreviewTimer = setTimeout(function () {
        TPP.renderImageExportPreview();
      }, 120);
    };
    imageExportPreset.addEventListener("change", function () {
      syncPresetUi();
      updateEstimate();
      schedulePreview();
    });
    imageExportFormat.addEventListener("change", function () {
      syncFormatUi();
      schedulePreview();
    });
    imageExportColorDepth.addEventListener("change", function () {
      syncFormatUi();
      schedulePreview();
    });
    imageExportQuality.addEventListener("input", function () {
      syncFormatUi();
      schedulePreview();
    });
    imageExportThreshold.addEventListener("input", function () {
      syncFormatUi();
      schedulePreview();
    });
    imageExportDpi.addEventListener("input", function () {
      updateEstimate();
      schedulePreview();
    });
    imageExportPreviewPrev.addEventListener("click", function () {
      TPP.imageExportPreviewIndex = Math.max(
        0,
        (TPP.imageExportPreviewIndex || 0) - 1,
      );
      TPP.renderImageExportPreview();
    });
    imageExportPreviewNext.addEventListener("click", function () {
      const count = TPP.buildPages().length;
      TPP.imageExportPreviewIndex = Math.min(
        Math.max(0, count - 1),
        (TPP.imageExportPreviewIndex || 0) + 1,
      );
      TPP.renderImageExportPreview();
    });
    imageExportDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === imageExportDialog && !card && imageExportDialog.open) {
        imageExportDialog.close();
        return;
      }
      const button = e.target.closest("[data-action]");
      if (!button) return;
      if (button.dataset.action === "cancel" && imageExportDialog.open) {
        imageExportDialog.close();
        return;
      }
      if (button.dataset.action === "export-images") {
        const dpi = TPP.dpi(Number(imageExportDpi.value) || 300);
        const format = imageExportFormat.value || "png";
        const quality = Math.max(
          1,
          Math.min(100, Number(imageExportQuality.value) || 92),
        );
        const colorDepth = imageExportColorDepth.value || "color24";
        const threshold = Math.max(
          0,
          Math.min(255, Number(imageExportThreshold.value) || 128),
        );
        imageExportDpi.value = dpi;
        imageExportPreset.value = presetValues.includes(String(dpi))
          ? String(dpi)
          : "custom";
        syncPresetUi();
        syncFormatUi();
        TPP.writeImageExportUi({
          dpi: dpi,
          format: format,
          quality: quality,
          colorDepth: colorDepth,
          threshold: threshold,
        });
        if (imageExportDialog.open) imageExportDialog.close();
        TPP.exportImagesZip({
          dpi: dpi,
          format: format,
          quality: quality,
          colorDepth: colorDepth,
          threshold: threshold,
        });
      }
    });
  }
});

TPP.openImageExportDialog = function () {
  const dialog = document.getElementById("imageExportDialog");
  const preset = document.getElementById("imageExportDialogPreset");
  const input = document.getElementById("imageExportDialogDpi");
  const customWrap = document.getElementById("imageExportDialogCustomWrap");
  const format = document.getElementById("imageExportDialogFormat");
  const colorDepth = document.getElementById("imageExportDialogColorDepth");
  const quality = document.getElementById("imageExportDialogQuality");
  const qualityWrap = document.getElementById("imageExportDialogQualityWrap");
  const qualityValue = document.getElementById("imageExportDialogQualityValue");
  const threshold = document.getElementById("imageExportDialogThreshold");
  const thresholdWrap = document.getElementById(
    "imageExportDialogThresholdWrap",
  );
  const thresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  if (
    !dialog ||
    !preset ||
    !input ||
    !customWrap ||
    !format ||
    !colorDepth ||
    !quality ||
    !qualityWrap ||
    !qualityValue ||
    !threshold ||
    !thresholdWrap ||
    !thresholdValue ||
    typeof dialog.showModal !== "function"
  )
    return;
  const ui = TPP.imageExportUi();
  const dpi = TPP.dpi(ui.dpi || 300);
  input.value = dpi;
  format.value = ui.format || "png";
  colorDepth.value = ui.colorDepth || "color24";
  quality.value = Math.max(1, Math.min(100, Number(ui.quality) || 92));
  threshold.value = Math.max(0, Math.min(255, Number(ui.threshold) || 128));
  qualityValue.textContent = quality.value + "%";
  thresholdValue.textContent = threshold.value;
  preset.value = ["72", "96", "150", "200", "300", "600"].includes(String(dpi))
    ? String(dpi)
    : "custom";
  customWrap.hidden = preset.value !== "custom";
  if (TPP.syncImageExportFormatUi) TPP.syncImageExportFormatUi();
  if (TPP.updateImageExportEstimate) TPP.updateImageExportEstimate();
  TPP.imageExportPreviewIndex = 0;
  dialog.showModal();
  TPP.renderImageExportPreview();
};

TPP.assetDialogTarget = null;
TPP.assetTargetSpec = function (targetType, targetKey) {
  if (targetType === "book") {
    const map = {
      coverImageId: {
        imageElement: TPP.findImageElement(TPP.active, "front", "cover"),
        label: "Front Cover Image",
      },
      backImageId: {
        imageElement: TPP.findImageElement(TPP.active, "back", "cover"),
        label: "Back Cover Image",
      },
      spineImageId: {
        imageElement: TPP.findImageElement(TPP.active, "spine", "cover"),
        label: "Spine Image",
      },
    };
    return map[targetKey] || null;
  }
  if (targetType === "chapter") {
    const chapter = ((TPP.active && TPP.active.chapters) || []).find(
      function (entry) {
        return entry.id === targetKey;
      },
    );
    if (!chapter) return null;
    return {
      chapter: chapter,
      imageElement: TPP.findChapterImageElement(TPP.active, chapter),
      label: 'Chapter Image: "' + (chapter.title || "Untitled") + '"',
    };
  }
  return null;
};
TPP.assetTargetValue = function (targetType, targetKey) {
  const spec = TPP.assetTargetSpec(targetType, targetKey);
  if (!spec) return "";
  return spec.imageElement ? spec.imageElement.fileId || "" : "";
};
TPP.setAssetTargetValue = function (targetType, targetKey, fileId) {
  const spec = TPP.assetTargetSpec(targetType, targetKey);
  if (!spec) return false;
  if (!spec.imageElement) return false;
  spec.imageElement.fileId = fileId || "";
  if (spec.chapter) spec.chapter.imageId = spec.imageElement.fileId;
  if (TPP.syncLegacyImageFieldsFromElements)
    TPP.syncLegacyImageFieldsFromElements(TPP.active);
  return true;
};
TPP.assetSlotHtml = function (label, targetKey, fileId, alt) {
  return TPP.assetFieldHtml(label, "book", targetKey, fileId, alt);
};
TPP.refreshAssetSlots = function () {
  if (!TPP.active) return;
  const coverSlot = document.getElementById("coverImageSlot");
  const backSlot = document.getElementById("backImageSlot");
  const spineSlot = document.getElementById("spineImageSlot");
  const front = TPP.findImageElement(TPP.active, "front", "cover");
  const back = TPP.findImageElement(TPP.active, "back", "cover");
  const spine = TPP.findImageElement(TPP.active, "spine", "cover");
  if (coverSlot)
    coverSlot.innerHTML = TPP.assetSlotHtml(
      "Cover Image",
      "coverImageId",
      front && front.fileId,
      TPP.active.title || "Cover image",
    );
  if (backSlot)
    backSlot.innerHTML = TPP.assetSlotHtml(
      "Back Image",
      "backImageId",
      back && back.fileId,
      (TPP.active.title || "Book") + " back image",
    );
  if (spineSlot)
    spineSlot.innerHTML = TPP.assetSlotHtml(
      "Spine Image",
      "spineImageId",
      spine && spine.fileId,
      (TPP.active.title || "Book") + " spine image",
    );
};
TPP.assetCardHtml = function (file, currentId) {
  const refs = TPP.fileReferences(TPP.active, file.id);
  const canDelete = refs.length === 0;
  return (
    '<article class="asset-card ' +
    (file.id === currentId ? "current" : "") +
    '">' +
    '<button type="button" class="asset-card-preview-button" data-asset-use="' +
    TPP.esc(file.id) +
    '">' +
    '<img class="asset-card-preview" src="' +
    TPP.esc(file.data) +
    '" alt="' +
    TPP.esc(file.name || file.type || "Image asset") +
    '">' +
    "</button>" +
    '<div class="asset-card-meta">' +
    '<div class="asset-card-title">' +
    TPP.esc(file.name || "Image Asset") +
    "</div>" +
    '<div class="asset-card-sub">' +
    TPP.esc(file.id) +
    "</div>" +
    '<div class="asset-card-sub">Hash: ' +
    TPP.esc(file.hash || "") +
    "</div>" +
    '<div class="asset-card-refs">' +
    (refs.length
      ? refs
          .map(function (ref) {
            return '<span class="asset-ref">' + TPP.esc(ref.label) + "</span>";
          })
          .join("")
      : '<span class="asset-ref">Unused</span>') +
    "</div>" +
    "</div>" +
    '<div class="asset-card-actions">' +
    '<button type="button" data-asset-use="' +
    TPP.esc(file.id) +
    '" class="primary alt">' +
    (file.id === currentId ? "Selected" : "Use This Image") +
    "</button>" +
    '<button type="button" data-asset-delete="' +
    TPP.esc(file.id) +
    '"' +
    (canDelete ? "" : " disabled") +
    ">Delete</button>" +
    "</div>" +
    "</article>"
  );
};
TPP.renderAssetDialog = function () {
  const dialog = document.getElementById("assetDialog");
  const title = document.getElementById("assetDialogTitle");
  const text = document.getElementById("assetDialogText");
  const list = document.getElementById("assetDialogList");
  const clearButton = document.getElementById("assetClearButton");
  if (!dialog || !title || !text || !list) return;
  const target = TPP.assetDialogTarget;
  const spec = target ? TPP.assetTargetSpec(target.type, target.key) : null;
  const currentId = target ? TPP.assetTargetValue(target.type, target.key) : "";
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
          return TPP.assetCardHtml(file, currentId);
        })
        .join("")
    : '<div class="asset-empty">No images have been uploaded for this book yet.</div>';
};
TPP.openAssetDialog = function (targetType, targetKey) {
  const dialog = document.getElementById("assetDialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  TPP.sync("nosave");
  TPP.assetDialogTarget = { type: targetType, key: targetKey };
  TPP.renderAssetDialog();
  if (!dialog.open) dialog.showModal();
};
TPP.commitAssetChange = function () {
  TPP.save("commit", TPP.active && TPP.bookId(TPP.active));
  TPP.loadForm();
  TPP.renderAll();
  if (
    document.getElementById("assetDialog") &&
    document.getElementById("assetDialog").open
  )
    TPP.renderAssetDialog();
};
TPP.closeAssetDialog = function () {
  const dialog = document.getElementById("assetDialog");
  if (dialog && dialog.open) dialog.close();
};
TPP.assignAssetToCurrentTarget = function (fileId) {
  const target = TPP.assetDialogTarget;
  if (!target || !TPP.active) return;
  if (!TPP.setAssetTargetValue(target.type, target.key, fileId)) return;
  TPP.commitAssetChange();
  TPP.closeAssetDialog();
};
TPP.uploadAssetToCurrentTarget = function (data, file) {
  if (!TPP.active) return;
  const fileId = TPP.upsertFileAsset(
    TPP.active,
    data,
    file && file.type,
    file && file.name,
  );
  TPP.assignAssetToCurrentTarget(fileId);
};
TPP.deleteAsset = function (fileId) {
  if (!TPP.active || !fileId) return;
  if (!TPP.removeFileAsset(TPP.active, fileId)) return;
  TPP.commitAssetChange();
};

TPP.importConflictStamp = function (book) {
  const date = new Date(TPP.bookUpdatedAt(book));
  if (Number.isNaN(date.getTime()))
    return TPP.bookUpdatedAt(book)
      ? String(TPP.bookUpdatedAt(book))
      : "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
TPP.importConflictPreview = function (book) {
  const cover =
    book && book.coverPreview
      ? '<img src="' +
        TPP.esc(book.coverPreview) +
        '" alt="' +
        TPP.esc((book && book.title) || "Book cover") +
        '" style="display:block;max-width:100%;height:auto;border-radius:14px;box-shadow:0 14px 30px rgb(0 0 0/.18)">'
      : '<div class="conflict-cover-fallback" style="background:linear-gradient(to bottom,' +
        TPP.esc((book && book.coverBg1) || "#7b1f2a") +
        "," +
        TPP.esc((book && book.coverBg2) || "#251d1d") +
        ')">' +
        TPP.esc((book && book.title) || "Untitled") +
        "</div>";
  return (
    '<article class="conflict-book">' +
    "<h3>" +
    TPP.esc((book && book.title) || "Untitled") +
    "</h3>" +
    '<div class="conflict-cover">' +
    cover +
    "</div>" +
    '<div class="conflict-meta">' +
    "<div><strong>ID:</strong> " +
    TPP.esc(TPP.bookId(book) || "—") +
    "</div>" +
    "<div><strong>Revision:</strong> " +
    TPP.esc(String(TPP.bookRevision(book) || 1)) +
    "." +
    TPP.esc(String(TPP.bookSubrevision(book) || 0)) +
    "</div>" +
    "<div><strong>Modified:</strong> " +
    TPP.esc(TPP.importConflictStamp(book)) +
    "</div>" +
    "</div>" +
    "</article>"
  );
};
TPP.resolveImportConflict = function (incoming, existing) {
  const dialog = document.getElementById("importConflictDialog");
  const text = document.getElementById("importConflictText");
  const books = document.getElementById("importConflictBooks");
  if (!dialog || !text || !books || typeof dialog.showModal !== "function")
    return Promise.resolve("cancel");
  text.textContent =
    'A book with id "' +
    (TPP.bookId(incoming) || "") +
    '" already exists. Choose how to handle this import.';
  books.innerHTML =
    '<div><div class="about-meta-label">Current Library Book</div>' +
    TPP.importConflictPreview(existing) +
    "</div>" +
    '<div><div class="about-meta-label">Incoming Import</div>' +
    TPP.importConflictPreview(incoming) +
    "</div>";
  return new Promise(function (resolve) {
    const handlers = [];
    const cleanup = function () {
      handlers.forEach(function (entry) {
        entry.button.removeEventListener("click", entry.handler);
      });
      dialog.removeEventListener("cancel", cancelHandler);
      dialog.removeEventListener("close", closeHandler);
    };
    const finish = function (action) {
      cleanup();
      if (dialog.open) dialog.close();
      resolve(action || "cancel");
    };
    Array.from(dialog.querySelectorAll("[data-action]")).forEach(
      function (button) {
        const handler = function () {
          finish(button.dataset.action);
        };
        handlers.push({ button: button, handler: handler });
        button.addEventListener("click", handler);
      },
    );
    const cancelHandler = function (event) {
      event.preventDefault();
      finish("cancel");
    };
    const closeHandler = function () {
      finish("cancel");
    };
    dialog.addEventListener("cancel", cancelHandler);
    dialog.addEventListener("close", closeHandler);
    dialog.showModal();
  });
};

TPP.validViews = function () {
  return ["editor", "about", "data", "interior", "cover", "reader", "library"];
};
TPP.toast = function (message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(TPP.toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  TPP.toastTimer = setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
};
TPP.initialView = function () {
  const hash = window.location.hash.replace(/^#/, "");
  const stored = TPP.readSettingsUi().view;
  if (TPP.validViews().includes(hash)) return hash;
  if (TPP.validViews().includes(stored)) return stored;
  return TPP.view || "editor";
};
TPP.readSettingsUi = function () {
  try {
    return JSON.parse(localStorage.getItem(TPP.UI) || "{}");
  } catch {
    return {};
  }
};
TPP.writeSettingsUi = function (state) {
  localStorage.setItem(TPP.UI, JSON.stringify(state || {}));
};
TPP.imageExportUi = function () {
  const state = TPP.readSettingsUi();
  return Object.assign(
    {
      dpi: 300,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
    },
    state.imageExport || {},
  );
};
TPP.writeImageExportUi = function (patch) {
  const state = TPP.readSettingsUi();
  const imageExport = Object.assign(
    {
      dpi: 300,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
    },
    state.imageExport || {},
    patch || {},
  );
  TPP.writeSettingsUi(Object.assign({}, state, { imageExport: imageExport }));
};
TPP.imageExportPixels = function (dpi) {
  const settings = TPP.settings();
  const targetDpi = TPP.dpi(dpi);
  return {
    dpi: targetDpi,
    width: Math.round(settings.page.w * targetDpi),
    height: Math.round(settings.page.h * targetDpi),
  };
};
TPP.imageExportPreviewIndex = 0;
TPP.renderImageExportPreview = async function () {
  const dialog = document.getElementById("imageExportDialog");
  const stage = document.getElementById("imageExportPreviewStage");
  const label = document.getElementById("imageExportPreviewLabel");
  const format = document.getElementById("imageExportDialogFormat");
  const colorDepth = document.getElementById("imageExportDialogColorDepth");
  const quality = document.getElementById("imageExportDialogQuality");
  const threshold = document.getElementById("imageExportDialogThreshold");
  const dpi = document.getElementById("imageExportDialogDpi");
  const thresholdValue = document.getElementById(
    "imageExportDialogThresholdValue",
  );
  if (
    !dialog ||
    !dialog.open ||
    !stage ||
    !label ||
    !format ||
    !colorDepth ||
    !quality ||
    !threshold ||
    !thresholdValue ||
    !dpi ||
    !TPP.renderImageExportPreviewCanvas
  )
    return;
  TPP.sync("nosave");
  const pages = TPP.buildPages();
  if (!pages.length) {
    stage.innerHTML =
      '<div class="image-export-preview-empty">No pages available to preview</div>';
    label.textContent = "No preview pages";
    return;
  }
  TPP.imageExportPreviewIndex = Math.max(
    0,
    Math.min(TPP.imageExportPreviewIndex || 0, pages.length - 1),
  );
  label.textContent =
    "Preview page " + (TPP.imageExportPreviewIndex + 1) + " of " + pages.length;
  const token = (TPP.imageExportPreviewToken || 0) + 1;
  TPP.imageExportPreviewToken = token;
  stage.innerHTML =
    '<div class="image-export-preview-empty">Rendering preview...</div>';
  const settings = TPP.settings();
  const exportOptions = TPP.imageExportOptions({
    dpi: Number(dpi.value) || 300,
    format: format.value || "png",
    quality: Number(quality.value) || 92,
    colorDepth: colorDepth.value || "color24",
    threshold: Number(threshold.value) || 128,
  });
  thresholdValue.textContent = String(exportOptions.threshold);
  const previewScale = Math.max(1, exportOptions.dpi / 96);
  try {
    const baseCanvas = await TPP.renderImageExportPreviewCanvas(
      pages[TPP.imageExportPreviewIndex],
      settings,
      previewScale,
    );
    if (TPP.imageExportPreviewToken !== token) return;
    const beforeSrc = TPP.previewDataUrl(baseCanvas, "png", 1);
    const afterCanvas = TPP.exportCanvasForDepth(
      baseCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
    );
    const [beforeSize, afterSize] = await Promise.all([
      TPP.previewBlobSize ? TPP.previewBlobSize(baseCanvas, "png", 1) : 0,
      TPP.previewBlobSize
        ? TPP.previewBlobSize(
            afterCanvas,
            exportOptions.format,
            exportOptions.quality / 100,
          )
        : 0,
    ]);
    const afterSrc = TPP.previewDataUrl(
      afterCanvas,
      exportOptions.format,
      exportOptions.quality / 100,
    );
    if (TPP.imageExportPreviewToken !== token) return;
    stage.innerHTML =
      '<div class="image-export-compare">' +
      '<img src="' +
      TPP.esc(beforeSrc) +
      '" alt="Original preview">' +
      '<img class="image-export-compare-after" src="' +
      TPP.esc(afterSrc) +
      '" alt="Exported preview">' +
      '<div class="image-export-compare-divider"></div>' +
      '<div class="image-export-compare-label before">Before<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel
          ? TPP.fileBytesLabel(beforeSize)
          : String(beforeSize),
      ) +
      "</span></div>" +
      '<div class="image-export-compare-label after">After<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel ? TPP.fileBytesLabel(afterSize) : String(afterSize),
      ) +
      "</span></div>" +
      "</div>";
  } catch (_error) {
    if (TPP.imageExportPreviewToken !== token) return;
    stage.innerHTML =
      '<div class="image-export-preview-empty">Unable to render preview</div>';
  }
};
TPP.readDataTab = function (validTabs) {
  const state = TPP.readSettingsUi();
  const stored =
    state && state.dataTabByBook && TPP.active
      ? state.dataTabByBook[TPP.bookId(TPP.active)]
      : "";
  const tabs = Array.isArray(validTabs) ? validTabs : [];
  if (stored && tabs.includes(stored)) return stored;
  return tabs[0] || "top";
};
TPP.writeDataTab = function (tabId) {
  if (!TPP.active) return;
  const state = TPP.readSettingsUi();
  const dataTabByBook = Object.assign({}, state.dataTabByBook || {});
  dataTabByBook[TPP.bookId(TPP.active)] = tabId || "top";
  TPP.writeSettingsUi(
    Object.assign({}, state, { dataTabByBook: dataTabByBook }),
  );
};
TPP.readerUiState = function () {
  const mode = document.getElementById("readerMode");
  return {
    mode: mode ? mode.value : "single",
    index: Math.max(0, Number(TPP.readerIndex) || 0),
  };
};
TPP.restoreReaderUi = function (state) {
  if (!TPP.active) return;
  const mode = document.getElementById("readerMode");
  const saved =
    state && state.readerByBook && state.readerByBook[TPP.bookId(TPP.active)];
  if (mode && saved && ["single", "spread", "duplex"].includes(saved.mode)) {
    mode.value = saved.mode;
  }
  TPP.readerIndex = Math.max(0, Number(saved && saved.index) || 0);
};
TPP.settingsDetails = function () {
  return Array.from(document.querySelectorAll(".controls details"));
};
TPP.restoreSettingsUi = function () {
  const state = TPP.readSettingsUi();
  TPP.settingsDetails().forEach(function (details, index) {
    details.dataset.settingsIndex = index;
    if (state.open && Object.prototype.hasOwnProperty.call(state.open, index)) {
      details.open = Boolean(state.open[index]);
    }
  });
  const controls = document.querySelector(".controls");
  if (controls && Number.isFinite(Number(state.scrollTop))) {
    requestAnimationFrame(function () {
      controls.scrollTop = Number(state.scrollTop) || 0;
    });
  }
  TPP.restoreReaderUi(state);
};
TPP.saveSettingsUi = function () {
  const controls = document.querySelector(".controls");
  const open = {};
  const state = TPP.readSettingsUi();
  const readerByBook = Object.assign({}, state.readerByBook || {});
  const dataTabByBook = Object.assign({}, state.dataTabByBook || {});
  TPP.settingsDetails().forEach(function (details, index) {
    open[index] = details.open;
  });
  if (TPP.active) readerByBook[TPP.bookId(TPP.active)] = TPP.readerUiState();
  TPP.writeSettingsUi({
    dataTabByBook: dataTabByBook,
    imageExport: state.imageExport || { dpi: 300 },
    readerByBook: readerByBook,
    open: open,
    scrollTop: controls ? controls.scrollTop : 0,
    view: TPP.view,
  });
};
TPP.bindSettingsUiPersistence = function () {
  const controls = document.querySelector(".controls");
  let scrollTimer = 0;
  TPP.settingsDetails().forEach(function (details, index) {
    details.dataset.settingsIndex = index;
    details.addEventListener("toggle", TPP.saveSettingsUi);
  });
  if (controls) {
    controls.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(TPP.saveSettingsUi, 120);
    });
  }
  window.addEventListener("beforeunload", TPP.saveSettingsUi);
  window.addEventListener("hashchange", function () {
    const view = TPP.initialView();
    if (view !== TPP.view) TPP.switchView(view, true);
  });
};
TPP.renderSidebarMode = function () {
  const controls = document.querySelector(".controls");
  const dataSidebar = document.getElementById("dataSidebar");
  const dataMode = TPP.view === "data";
  if (controls) controls.hidden = dataMode;
  if (dataSidebar) dataSidebar.hidden = !dataMode;
};

TPP.switchView = function (view, fromHash) {
  if (!TPP.validViews().includes(view)) view = "editor";
  TPP.view = view;
  if (!fromHash && window.location.hash !== "#" + view) {
    history.replaceState(null, "", "#" + view);
  }
  TPP.saveSettingsUi();
  document.querySelectorAll(".tab").forEach(function (button) {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach(function (element) {
    element.classList.remove("active");
  });
  document.getElementById(view + "View").classList.add("active");
  TPP.renderSidebarMode();
  TPP.renderAll();
};
TPP.renderAll = function () {
  TPP.renderSidebarMode();
  if (TPP.view === "editor") {
    TPP.renderChapterList();
    TPP.renderChapterEditor();
  }
  if (TPP.view === "about") TPP.renderAbout();
  if (TPP.view === "data") TPP.renderData();
  if (TPP.view === "interior") TPP.renderInterior();
  if (TPP.view === "cover") TPP.renderCover();
  if (TPP.view === "reader") TPP.renderReader();
  if (TPP.view === "library") TPP.renderLibrary();
};
TPP.readerDuplexSheets = function (pages, signatureSize) {
  return TPP.signaturePlan(pages, signatureSize).flatMap(function (signature) {
    return signature.sheets.map(function (sheet) {
      return {
        signature: signature.index,
        signatureStart: signature.startPage,
        signatureEnd: signature.endPage,
        sheet: sheet.index,
        front: sheet.front,
        back: sheet.back,
      };
    });
  });
};
TPP.readerDuplexSheetPages = function (pages, sheetIndex, signatureSize) {
  const sheets = TPP.readerDuplexSheets(pages, signatureSize);
  return sheets[Math.max(0, Math.min(sheetIndex, sheets.length - 1))] || null;
};
TPP.readerPageToDuplexSheet = function (pages, pageIndex, signatureSize) {
  const target = Math.max(1, pageIndex + 1);
  const sheets = TPP.readerDuplexSheets(pages, signatureSize);
  const match = sheets.findIndex(function (sheet) {
    return sheet.front.pages.concat(sheet.back.pages).includes(target);
  });
  return match >= 0 ? match : 0;
};
TPP.readerGoToDuplexNeighbor = function (pages, settings, pageNumber, delta) {
  const nextPage = Math.max(
    1,
    Math.min(pages.length, Number(pageNumber || 0) + delta),
  );
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerPageToDuplexSheet(pages, nextPage - 1, settings.signatureSize),
    pages,
    "duplex",
    settings,
  );
  TPP.renderReader();
};
TPP.readerNav = function (pages, mode, settings) {
  const duplex = mode === "duplex";
  const options = [
    '<option value="0">' +
      (duplex ? "First Sheet" : "Front Cover") +
      "</option>",
  ];
  const tocIndex = pages.findIndex(function (p) {
    return p.type === "toc";
  });
  const tocValue = duplex
    ? TPP.readerPageToDuplexSheet(pages, tocIndex, settings.signatureSize)
    : tocIndex;
  if (tocIndex >= 0)
    options.push('<option value="' + tocValue + '">Table of Contents</option>');
  TPP.active.chapters.forEach(function (chapter) {
    const pageIndex = pages.findIndex(function (p) {
      return p.html.includes(TPP.esc(chapter.title || ""));
    });
    const index = duplex
      ? TPP.readerPageToDuplexSheet(pages, pageIndex, settings.signatureSize)
      : pageIndex;
    if (pageIndex >= 0)
      options.push(
        '<option value="' +
          index +
          '">' +
          "— ".repeat(chapter.level || 0) +
          TPP.esc(chapter.title || "Untitled") +
          "</option>",
      );
  });
  options.push(
    '<option value="' +
      (duplex
        ? Math.max(
            0,
            TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1,
          )
        : pages.length - 1) +
      '">' +
      (duplex ? "Last Sheet" : "Last Page") +
      "</option>",
  );
  document.getElementById("readerJump").innerHTML = options.join("");
  document.getElementById("readerJump").value = TPP.readerIndex;
};
TPP.readerNormalizeIndex = function (index, pages, mode, settings) {
  const signatureSize = TPP.signatureSize(settings && settings.signatureSize);
  const last =
    mode === "duplex"
      ? Math.max(0, TPP.readerDuplexSheets(pages, signatureSize).length - 1)
      : Math.max(0, pages.length - 1);
  let next = Math.max(0, Math.min(Number(index) || 0, last));
  if (mode === "spread" && next > 0 && next % 2 === 0) next -= 1;
  return next;
};
TPP.readerProgressText = function (pages, index, mode, settings) {
  if (mode === "duplex") {
    const sheets = TPP.readerDuplexSheets(pages, settings.signatureSize);
    const sheet = TPP.readerDuplexSheetPages(
      pages,
      index,
      settings.signatureSize,
    );
    if (!sheet) return "No interior sheets";
    return (
      "Signature " +
      (sheet.signature + 1) +
      " • Sheet " +
      (sheet.sheet + 1) +
      " of " +
      sheets.length +
      " • " +
      sheet.front.pages[0] +
      ", " +
      sheet.front.pages[1] +
      " / " +
      sheet.back.pages[0] +
      ", " +
      sheet.back.pages[1]
    );
  }
  const start = Math.min(pages.length, index + 1);
  if (mode !== "spread" || index === 0 || index >= pages.length - 1)
    return "Page " + start + " of " + pages.length;
  return (
    "Pages " +
    start +
    "-" +
    Math.min(pages.length, index + 2) +
    " of " +
    pages.length
  );
};
TPP.syncReaderProgress = function (pages, index, mode, settings) {
  const scrub = document.getElementById("readerScrub");
  const label = document.getElementById("readerProgressLabel");
  const start = document.getElementById("readerProgressStart");
  const end = document.getElementById("readerProgressEnd");
  if (!scrub || !label || !start || !end) return;
  scrub.max =
    mode === "duplex"
      ? Math.max(
          0,
          TPP.readerDuplexSheets(pages, settings.signatureSize).length - 1,
        )
      : Math.max(0, pages.length - 1);
  scrub.value = index;
  const span = Number(scrub.max) || 0;
  const pct = span <= 0 ? 0 : (index / span) * 100;
  scrub.style.setProperty("--reader-progress", pct + "%");
  label.textContent = TPP.readerProgressText(pages, index, mode, settings);
  start.textContent = mode === "duplex" ? "Sheet 1" : "1";
  end.textContent =
    mode === "duplex"
      ? "Sheet " + (Number(scrub.max) + 1 || 1)
      : String(pages.length);
};
TPP.readerPageOrBlank = function (pages, number) {
  return pages[number - 1] || { n: number, type: "blank", html: "" };
};
TPP.readerMiniPage = function (page, settings, pageSide) {
  const shell = document.createElement("div");
  shell.className = "reader-shell";
  shell.style.width = settings.page.w + "in";
  shell.style.height = settings.page.h + "in";
  const pageEl = TPP.pageEl(page, settings, 0, 0, false, true);
  if (pageSide) pageEl.classList.add("page-side-" + pageSide);
  shell.appendChild(pageEl);
  return shell;
};
TPP.oppositePageSide = function (side) {
  return side === "left" ? "right" : "left";
};
TPP.renderReaderDuplex = function (pages, settings, sheetIndex) {
  const preview = document.getElementById("readerPreview");
  const sheet = TPP.readerDuplexSheetPages(
    pages,
    sheetIndex,
    settings.signatureSize,
  );
  preview.innerHTML = "";
  if (!sheet) {
    preview.textContent = "No interior duplex sheets to preview yet.";
    return;
  }
  const duplex = document.createElement("div");
  duplex.className = "duplex-sheet";
  const layout = [
    {
      side: "left",
      title: "Leaf " + sheet.front.pages[0] + " / " + sheet.back.pages[1],
      front: TPP.readerPageOrBlank(pages, sheet.front.pages[0]),
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[1]),
    },
    {
      side: "right",
      title: "Leaf " + sheet.front.pages[1] + " / " + sheet.back.pages[0],
      front: TPP.readerPageOrBlank(pages, sheet.front.pages[1]),
      back: TPP.readerPageOrBlank(pages, sheet.back.pages[0]),
    },
  ];
  const readerWidth = settings.page.w * 2.45;
  const readerHeight = settings.page.h * 2.2;
  const scale = Math.min(
    4,
    Math.max(
      0.75,
      Math.min(
        (window.innerWidth - 560) / (readerWidth * 96),
        (window.innerHeight - 240) / (readerHeight * 96),
      ),
    ),
  );
  duplex.style.transform = "scale(" + scale + ")";
  layout.forEach(function (leaf) {
    const leafEl = document.createElement("div");
    leafEl.className = "duplex-leaf";
    const title = document.createElement("div");
    title.className = "duplex-leaf-label";
    title.textContent = leaf.title;
    leafEl.appendChild(title);
    [
      ["Front side", leaf.front, leaf.side, leaf.side === "left" ? 1 : -1],
      [
        "Back side",
        leaf.back,
        TPP.oppositePageSide(leaf.side),
        leaf.side === "left" ? -1 : 1,
      ],
    ].forEach(function (face) {
      const faceEl = document.createElement("div");
      faceEl.className = "duplex-face";
      const label = document.createElement("div");
      label.className = "duplex-face-label";
      label.textContent = face[0];
      faceEl.appendChild(label);
      const mini = TPP.readerMiniPage(face[1], settings, face[2]);
      mini.onclick = function () {
        TPP.readerGoToDuplexNeighbor(
          pages,
          settings,
          face[1] && face[1].n,
          face[3],
        );
      };
      faceEl.appendChild(mini);
      leafEl.appendChild(faceEl);
    });
    duplex.appendChild(leafEl);
  });
  preview.appendChild(duplex);
};
TPP.renderReader = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const mode = document.getElementById("readerMode").value;
  TPP.readerIndex = TPP.readerNormalizeIndex(
    TPP.readerIndex,
    pages,
    mode,
    settings,
  );
  TPP.saveSettingsUi();
  TPP.readerNav(pages, mode, settings);
  TPP.syncReaderProgress(pages, TPP.readerIndex, mode, settings);
  if (mode === "duplex") {
    TPP.renderReaderDuplex(pages, settings, TPP.readerIndex);
    return;
  }
  const frontCover =
    pages[TPP.readerIndex] && pages[TPP.readerIndex].role === "front";
  const spineW = frontCover ? TPP.spineWidth(settings) : 0;
  const shown =
    mode === "spread"
      ? frontCover
        ? [pages[TPP.readerIndex]]
        : [pages[TPP.readerIndex], pages[TPP.readerIndex + 1] || null]
      : [pages[TPP.readerIndex]];
  const spread = document.createElement("div");
  spread.className = "spread";
  const readerWidth = frontCover
    ? settings.page.w + spineW
    : mode === "spread"
      ? settings.page.w * 2.25
      : settings.page.w;
  const scale = Math.min(
    5,
    Math.max(1.2, (window.innerWidth - 560) / (readerWidth * 96)),
  );
  spread.style.transform = "scale(" + scale + ")";
  shown.forEach(function (page, shownIndex) {
    const shell = document.createElement("div");
    shell.className = "reader-shell";
    const withSpine = page && page.role === "front" && spineW > 0;
    shell.style.width = settings.page.w + (withSpine ? spineW : 0) + "in";
    shell.style.height = settings.page.h + "in";
    if (withSpine) {
      shell.appendChild(TPP.spineEl(settings, spineW / 2, 0, settings.page.h));
      shell.appendChild(TPP.pageEl(page, settings, spineW, 0, false, false));
    } else if (page) {
      shell.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    }
    shell.onclick = function () {
      if (mode === "spread" && shown.length > 1 && shownIndex === 0) {
        TPP.readerGoPrev();
      } else {
        TPP.readerGoNext();
      }
    };
    spread.appendChild(shell);
  });
  document.getElementById("readerPreview").innerHTML = "";
  document.getElementById("readerPreview").appendChild(spread);
};
