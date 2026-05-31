document.addEventListener("DOMContentLoaded", async function () {
  const dragPreview = document.createElement("div");
  dragPreview.className = "drag-preview-chip";
  dragPreview.setAttribute("aria-hidden", "true");
  dragPreview.innerHTML =
    '<span class="drag-preview-handle">⋮⋮</span><span class="drag-preview-label"></span>';
  document.body.appendChild(dragPreview);
  TPP.classificationCatalog = null;
  TPP.classificationDialogTargetEntryId = "";
  TPP.classificationDialogPath = [];
  TPP.classificationDialogSystemId = "";
  TPP.loadClassificationSystems = async function () {
    if (TPP.classificationCatalog) return TPP.classificationCatalog;
    try {
      const response = await fetch("data/classification-systems.json");
      if (!response.ok) throw new Error("classification");
      TPP.classificationCatalog = await response.json();
    } catch (_error) {
      TPP.classificationCatalog = {
        defaultSystemId: "",
        systems: [],
      };
    }
    return TPP.classificationCatalog;
  };
  TPP.classificationSystem = function () {
    const catalog = TPP.classificationCatalog || { systems: [] };
    const systems = Array.isArray(catalog.systems) ? catalog.systems : [];
    return (
      systems.find(function (system) {
        return system && system.id === catalog.defaultSystemId;
      }) ||
      systems[0] ||
      null
    );
  };
  TPP.classificationNodeChildren = function (path) {
    const system = TPP.classificationSystem();
    let nodes = Array.isArray(system && system.categories)
      ? system.categories
      : [];
    (Array.isArray(path) ? path : []).forEach(function (index) {
      const node = nodes[index];
      nodes = Array.isArray(node && node.children) ? node.children : [];
    });
    return nodes;
  };
  TPP.classificationNodeAtPath = function (path) {
    const fullPath = Array.isArray(path) ? path : [];
    if (!fullPath.length) return null;
    const parent = TPP.classificationNodeChildren(fullPath.slice(0, -1));
    return parent[fullPath[fullPath.length - 1]] || null;
  };
  TPP.classificationBreadcrumbNodes = function (path) {
    const crumbs = [];
    (Array.isArray(path) ? path : []).forEach(function (_unused, index) {
      const crumbPath = path.slice(0, index + 1);
      const node = TPP.classificationNodeAtPath(crumbPath);
      if (node) crumbs.push({ path: crumbPath, node: node });
    });
    return crumbs;
  };
  TPP.classificationPathForCode = function (code) {
    const target = String(code || "").trim();
    if (!target) return [];
    const system = TPP.classificationSystem();
    let found = [];
    const walk = function (nodes, path) {
      (Array.isArray(nodes) ? nodes : []).forEach(function (node, index) {
        if (!node || found.length) return;
        const nextPath = path.concat(index);
        if (node.code === target) {
          found = nextPath;
          return;
        }
        walk(node.children, nextPath);
      });
    };
    walk(system && system.categories, []);
    return found;
  };
  TPP.classificationSummary = function (value) {
    const text = String(value || "").trim();
    if (!text)
      return {
        title: "Choose classification",
        meta: "No classification selected",
      };
    const system = TPP.classificationSystem();
    const found = [];
    const walk = function (nodes, parents) {
      (Array.isArray(nodes) ? nodes : []).forEach(function (node) {
        if (!node || found.length) return;
        const nextParents = parents.concat(node);
        if (node.code === text) {
          found.push(nextParents);
          return;
        }
        walk(node.children, nextParents);
      });
    };
    walk(system && system.categories, []);
    if (found.length) {
      const nodes = found[0];
      return {
        title: text,
        meta:
          (system && system.name ? system.name + ": " : "") +
          nodes
            .map(function (node) {
              return node.label;
            })
            .join(" > "),
      };
    }
    return {
      title: text,
      meta:
        (system && system.name ? system.name + ": " : "") +
        "Custom or unknown shelfmark",
    };
  };
  TPP.renderClassificationDialog = function () {
    const system = TPP.classificationSystem();
    const title = document.getElementById("classificationDialogTitle");
    const description = document.getElementById(
      "classificationDialogDescription",
    );
    const breadcrumbs = document.getElementById("classificationBreadcrumbs");
    const selection = document.getElementById("classificationSelection");
    const list = document.getElementById("classificationDialogList");
    if (title) title.textContent = (system && system.name) || "Classification";
    if (description)
      description.textContent =
        (system && system.description) ||
        "Choose a shelfmark by drilling into categories.";
    if (breadcrumbs) {
      const crumbs = TPP.classificationBreadcrumbNodes(
        TPP.classificationDialogPath,
      );
      breadcrumbs.innerHTML =
        '<button type="button" class="classification-crumb' +
        (crumbs.length ? "" : " is-active") +
        '" data-classification-crumb="">Top</button>' +
        crumbs
          .map(function (crumb) {
            return (
              '<span class="classification-crumb-sep">/</span><button type="button" class="classification-crumb is-active" data-classification-crumb="' +
              TPP.esc(JSON.stringify(crumb.path)) +
              '">' +
              TPP.esc(crumb.node.label) +
              "</button>"
            );
          })
          .join("");
    }
    const selectedNode = TPP.classificationNodeAtPath(
      TPP.classificationDialogPath,
    );
    if (selection) {
      if (selectedNode && selectedNode.code) {
        selection.hidden = false;
        selection.innerHTML =
          "<div><strong>" +
          TPP.esc(selectedNode.code) +
          '</strong><div class="small">' +
          TPP.esc(
            TPP.classificationBreadcrumbNodes(TPP.classificationDialogPath)
              .map(function (crumb) {
                return crumb.node.label;
              })
              .join(" > "),
          ) +
          '</div></div><div class="toolbar"><button type="button" class="primary" data-classification-select="' +
          TPP.esc(selectedNode.code) +
          '">Use This Shelfmark</button><button type="button" data-classification-clear="1">Clear</button></div>';
      } else {
        selection.hidden = true;
        selection.innerHTML = "";
      }
    }
    if (list) {
      const children = TPP.classificationNodeChildren(
        TPP.classificationDialogPath,
      );
      list.innerHTML = children.length
        ? children
            .map(function (node, index) {
              const nextPath = TPP.classificationDialogPath.concat(index);
              const hasChildren =
                Array.isArray(node.children) && node.children.length;
              return (
                '<div class="classification-option"><div><strong>' +
                TPP.esc(node.code || "") +
                "</strong> " +
                TPP.esc(node.label || "") +
                '</div><div class="toolbar">' +
                (hasChildren
                  ? '<button type="button" data-classification-open="' +
                    TPP.esc(JSON.stringify(nextPath)) +
                    '">Open</button>'
                  : "") +
                (node.code
                  ? '<button type="button" class="primary alt" data-classification-select="' +
                    TPP.esc(node.code) +
                    '">Use</button>'
                  : "") +
                "</div></div>"
              );
            })
            .join("")
        : '<div class="front-cover-field-empty">No deeper categories here.</div>';
    }
  };
  TPP.openClassificationDialog = async function (entryId) {
    const dialog = document.getElementById("classificationDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    await TPP.loadClassificationSystems();
    TPP.classificationDialogTargetEntryId = entryId || "";
    const row = document.querySelector(
      '.book-info-entry[data-entry-id="' +
        TPP.classificationDialogTargetEntryId +
        '"]',
    );
    const currentValue = row && row.querySelector(".book-info-value");
    TPP.classificationDialogPath = TPP.classificationPathForCode(
      currentValue && currentValue.value,
    );
    TPP.renderClassificationDialog();
    if (!dialog.open) dialog.showModal();
  };
  TPP.applyClassificationValue = function (value) {
    const row = document.querySelector(
      '.book-info-entry[data-entry-id="' +
        TPP.classificationDialogTargetEntryId +
        '"]',
    );
    const input = row && row.querySelector(".book-info-value");
    if (!input) return;
    input.value = value || "";
    TPP.sync("commit");
    TPP.loadForm();
    TPP.renderAll();
  };

  TPP.populate();
  await TPP.load();
  await TPP.loadStaleKeyLookup();
  await TPP.loadClassificationSystems();
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
  const toggleBookButtonText = document.getElementById("toggleBookButtonText");
  if (toggleBookButtonText) {
    toggleBookButtonText.onclick = function () {
      const state = TPP.readSettingsUi();
      const show = state.showBookButtonText === false;
      TPP.setBookButtonTextVisibility(show);
      TPP.writeSettingsUi(
        Object.assign({}, state, { showBookButtonText: show }),
      );
      TPP.saveSettingsUi();
    };
  }

  const renderCurrentViewPreservingSidebar = function () {
    if (TPP.view === "about") TPP.renderAbout();
    else if (TPP.view === "software") TPP.renderSoftwareAbout();
    else if (TPP.view === "data") TPP.renderData();
    else if (TPP.view === "interior") TPP.renderInterior();
    else if (TPP.view === "cover") TPP.renderCover();
    else if (TPP.view === "reader") TPP.renderReader();
    else if (TPP.view === "library") TPP.renderLibrary();
    if (TPP.renderColorPalettes) TPP.renderColorPalettes();
  };
  TPP.normalizeHexColor = function (value) {
    const text = String(value || "").trim();
    const match = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return "";
    const hex = match[1].toLowerCase();
    if (hex.length === 3) {
      return (
        "#" +
        hex
          .split("")
          .map(function (part) {
            return part + part;
          })
          .join("")
      );
    }
    return "#" + hex;
  };
  TPP.collectUsedColors = function (book) {
    const found = [];
    const seenColors = new Set();
    const seenObjects = new Set();
    const pushColor = function (value) {
      const normalized = TPP.normalizeHexColor(value);
      if (!normalized || seenColors.has(normalized)) return;
      seenColors.add(normalized);
      found.push(normalized);
    };
    const visit = function (value) {
      if (!value) return;
      if (typeof value === "string") {
        pushColor(value);
        return;
      }
      if (typeof value !== "object") return;
      if (seenObjects.has(value)) return;
      seenObjects.add(value);
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      Object.keys(value).forEach(function (key) {
        visit(value[key]);
      });
    };
    visit(book);
    document
      .querySelectorAll('.controls input[type="color"]')
      .forEach(function (input) {
        pushColor(input.value);
      });
    return TPP.sortColorsByHsv(found);
  };
  TPP.colorPaletteAnchor = function (input) {
    if (!input) return null;
    if (
      input.parentElement &&
      input.parentElement.classList.contains("color-picker-shell")
    )
      return input.parentElement;
    const wrapper = document.createElement("span");
    wrapper.className = "color-picker-shell";
    input.insertAdjacentElement("beforebegin", wrapper);
    wrapper.appendChild(input);
    return wrapper;
  };
  TPP.renderColorPickerTriggers = function () {
    const controlsRoot = document.querySelector(".controls");
    if (!controlsRoot) return;
    controlsRoot
      .querySelectorAll('input[type="color"]')
      .forEach(function (input) {
        const anchor = TPP.colorPaletteAnchor(input);
        if (!anchor) return;
        input.classList.add("color-input-native");
        input.tabIndex = -1;
        if (!input.dataset.colorInputId)
          input.dataset.colorInputId = "color-input-" + TPP.uid();
        let trigger = anchor.querySelector(".color-picker-trigger");
        if (!trigger) {
          trigger = document.createElement("button");
          trigger.type = "button";
          trigger.className = "color-picker-trigger";
          anchor.appendChild(trigger);
        }
        trigger.dataset.colorTarget = input.dataset.colorInputId;
        trigger.setAttribute(
          "aria-label",
          (input.getAttribute("aria-label") || "Choose color") +
            " " +
            (TPP.normalizeHexColor(input.value) || ""),
        );
        trigger.title = TPP.normalizeHexColor(input.value) || "Choose color";
        trigger.style.setProperty(
          "--picker-color",
          TPP.normalizeHexColor(input.value) || "#000000",
        );
      });
  };
  TPP.renderColorPalettes = function () {
    TPP.renderColorPickerTriggers();
  };
  TPP.colorDialogValue = "#000000";
  TPP.colorDialogTargetId = "";
  TPP.colorDialogAnchorId = "";
  TPP.colorPickerState = { h: 0, s: 0, v: 0 };
  TPP.clamp01 = function (value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  };
  TPP.clampHue = function (value) {
    const raw = Number(value) || 0;
    return ((raw % 360) + 360) % 360;
  };
  TPP.hsvToRgb = function (h, s, v) {
    const hue = TPP.clampHue(h);
    const sat = TPP.clamp01(s);
    const val = TPP.clamp01(v);
    const c = val * sat;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = val - c;
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue < 60) [r, g, b] = [c, x, 0];
    else if (hue < 120) [r, g, b] = [x, c, 0];
    else if (hue < 180) [r, g, b] = [0, c, x];
    else if (hue < 240) [r, g, b] = [0, x, c];
    else if (hue < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };
  TPP.rgbToHex = function (rgb) {
    return (
      "#" +
      [rgb.r, rgb.g, rgb.b]
        .map(function (value) {
          return Math.max(0, Math.min(255, Number(value) || 0))
            .toString(16)
            .padStart(2, "0");
        })
        .join("")
    );
  };
  TPP.hexToHsv = function (hex) {
    const normalized = TPP.normalizeHexColor(hex) || "#000000";
    const r = parseInt(normalized.slice(1, 3), 16) / 255;
    const g = parseInt(normalized.slice(3, 5), 16) / 255;
    const b = parseInt(normalized.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : delta / max;
    return { h: h, s: s, v: max };
  };
  TPP.sortColorsByHsv = function (colors) {
    return (Array.isArray(colors) ? colors.slice() : []).sort(function (a, b) {
      const left = TPP.hexToHsv(a);
      const right = TPP.hexToHsv(b);
      const hueDiff = left.h - right.h;
      if (Math.abs(hueDiff) > 0.0001) return hueDiff;
      const satDiff = left.s - right.s;
      if (Math.abs(satDiff) > 0.0001) return satDiff;
      const valueDiff = left.v - right.v;
      if (Math.abs(valueDiff) > 0.0001) return valueDiff;
      return String(a).localeCompare(String(b));
    });
  };
  TPP.colorFromPickerState = function () {
    return TPP.rgbToHex(
      TPP.hsvToRgb(
        TPP.colorPickerState.h,
        TPP.colorPickerState.s,
        TPP.colorPickerState.v,
      ),
    );
  };
  TPP.renderColorDialogSwatches = function (colors, selected, container) {
    if (!container) return;
    container.innerHTML = colors.length
      ? colors
          .map(function (color) {
            return (
              '<button type="button" class="color-dialog-swatch' +
              (color === selected ? " is-active" : "") +
              '" data-dialog-color="' +
              color +
              '" title="' +
              color +
              '" aria-label="Use color ' +
              color +
              '" style="--swatch:' +
              color +
              '"></button>'
            );
          })
          .join("")
      : '<div class="color-dialog-empty">No colors used yet.</div>';
  };
  TPP.positionColorPopover = function () {
    const popover = document.getElementById("colorPickerPopover");
    const anchor = document.querySelector(
      '[data-color-input-id="' + TPP.colorDialogAnchorId + '"]',
    );
    if (!popover || !anchor) return;
    const trigger =
      anchor.parentElement &&
      anchor.parentElement.querySelector(".color-picker-trigger");
    const rect = (trigger || anchor).getBoundingClientRect();
    popover.hidden = false;
    const popRect = popover.getBoundingClientRect();
    const width = popRect.width || 320;
    const height = popRect.height || 420;
    const gap = 8;
    let left = rect.left;
    let top = rect.bottom + gap;
    if (left + width > window.innerWidth - 12)
      left = Math.max(12, window.innerWidth - width - 12);
    if (top + height > window.innerHeight - 12)
      top = Math.max(12, rect.top - height - gap);
    popover.style.left = Math.round(left) + "px";
    popover.style.top = Math.round(top) + "px";
  };
  TPP.updateColorDialogPreview = function (value, skipApply) {
    const color = TPP.normalizeHexColor(value) || TPP.colorDialogValue;
    const preview = document.getElementById("colorPickerPreview");
    const hex = document.getElementById("colorPickerHex");
    const surface = document.getElementById("colorPickerSurface");
    const surfaceMarker = document.getElementById("colorPickerSurfaceMarker");
    const hue = document.getElementById("colorPickerHue");
    const hueMarker = document.getElementById("colorPickerHueMarker");
    TPP.colorPickerState = TPP.hexToHsv(color);
    if (preview) preview.style.setProperty("--picker-color", color);
    if (hex && document.activeElement !== hex) hex.value = color;
    if (surface) {
      surface.style.setProperty(
        "--picker-hue",
        "hsl(" + Math.round(TPP.colorPickerState.h) + " 100% 50%)",
      );
    }
    if (surfaceMarker) {
      surfaceMarker.style.left = TPP.colorPickerState.s * 100 + "%";
      surfaceMarker.style.top = (1 - TPP.colorPickerState.v) * 100 + "%";
    }
    if (hueMarker) {
      hueMarker.style.left = (TPP.colorPickerState.h / 360) * 100 + "%";
    }
    if (hue) {
      hue.style.setProperty(
        "--picker-hue",
        "hsl(" + Math.round(TPP.colorPickerState.h) + " 100% 50%)",
      );
    }
    TPP.colorDialogValue = color;
    TPP.renderColorDialogSwatches(
      TPP.collectUsedColors(TPP.active),
      color,
      document.getElementById("colorPickerUsedColors"),
    );
    if (!skipApply) TPP.applyColorDialogValue();
  };
  TPP.applyColorDialogValue = function () {
    const target = document.querySelector(
      '[data-color-input-id="' + TPP.colorDialogTargetId + '"]',
    );
    if (!target) return;
    target.value = TPP.colorDialogValue;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  };
  TPP.closeColorDialog = function () {
    const popover = document.getElementById("colorPickerPopover");
    if (!popover) return;
    popover.hidden = true;
    TPP.colorDialogAnchorId = "";
  };
  TPP.openColorDialog = function (input) {
    const popover = document.getElementById("colorPickerPopover");
    if (!popover || !input) return;
    if (!input.dataset.colorInputId)
      input.dataset.colorInputId = "color-input-" + TPP.uid();
    TPP.colorDialogTargetId = input.dataset.colorInputId;
    TPP.colorDialogAnchorId = input.dataset.colorInputId;
    TPP.colorDialogValue = TPP.normalizeHexColor(input.value) || "#000000";
    popover.hidden = false;
    TPP.updateColorDialogPreview(TPP.colorDialogValue, true);
    TPP.positionColorPopover();
  };
  TPP.renderFrontCoverFieldDialog = function () {
    const list = document.getElementById("frontCoverFieldDialogList");
    if (!list) return;
    const options = TPP.frontCoverFieldPickerOptions(TPP.active);
    list.innerHTML = options.length
      ? options
          .map(function (option) {
            const preview = TPP.bookInfoFieldValue(TPP.active, option.value, {
              location: "front",
            });
            return (
              '<button type="button" class="front-cover-field-option" data-front-cover-field="' +
              TPP.esc(option.value) +
              '"><span><strong>' +
              TPP.esc(option.label) +
              "</strong><p>" +
              TPP.esc(preview || "Empty value") +
              "</p></span><span>Add</span></button>"
            );
          })
          .join("")
      : '<div class="front-cover-field-empty">All current Book Info fields are already on the front cover.</div>';
  };
  TPP.openFrontCoverFieldDialog = function () {
    const dialog = document.getElementById("frontCoverFieldDialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    TPP.renderFrontCoverFieldDialog();
    if (!dialog.open) dialog.showModal();
  };

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
    let dragState = null;
    let dragHandleArmedId = "";
    const setDragPreviewLabel = function (item) {
      const label = dragPreview.querySelector(".drag-preview-label");
      if (!label) return;
      const source =
        item?.querySelector("td:first-child, .toolbar strong, strong") || item;
      const text = (source?.textContent || "")
        .replace(/⋮+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      label.textContent = text || "Dragging item";
    };
    const setFrontCoverTrashVisibility = function (active) {
      const dropZone = document.getElementById("frontCoverTrashDrop");
      if (!dropZone) return;
      dropZone.classList.toggle("is-visible", !!active);
      if (!active) dropZone.classList.remove("is-over");
      dropZone.setAttribute("aria-hidden", active ? "false" : "true");
    };
    controls.addEventListener("input", function (e) {
      const bookInfoEntry = e.target.closest(".book-info-entry");
      const textElementEntry = e.target.closest(".text-element-group");
      const copyrightItem = e.target.closest(".copyright-item-group");
      if (!bookInfoEntry && !textElementEntry && !copyrightItem) return;
      TPP.sync("draft");
      if (bookInfoEntry) {
        renderCurrentViewPreservingSidebar();
        return;
      }
      if (textElementEntry || copyrightItem) {
        if (
          e.target.classList.contains("text-field-key") ||
          e.target.classList.contains("copyright-field-key")
        ) {
          TPP.renderTextElementControls();
        }
        renderCurrentViewPreservingSidebar();
        return;
      }
      if (
        e.target.classList.contains("book-info-custom-label") ||
        e.target.classList.contains("book-info-value") ||
        e.target.classList.contains("text-field-key") ||
        e.target.classList.contains("copyright-field-key")
      ) {
        TPP.renderTextElementControls();
      }
      TPP.renderAll();
    });
    controls.addEventListener("change", function (e) {
      const bookInfoEntry = e.target.closest(".book-info-entry");
      const textElementEntry = e.target.closest(".text-element-group");
      const copyrightItem = e.target.closest(".copyright-item-group");
      if (!bookInfoEntry && !textElementEntry && !copyrightItem) return;
      TPP.sync("commit");
      if (bookInfoEntry) {
        renderCurrentViewPreservingSidebar();
        return;
      }
      if (textElementEntry || copyrightItem) {
        if (
          e.target.classList.contains("text-field-key") ||
          e.target.classList.contains("copyright-field-key")
        ) {
          TPP.renderTextElementControls();
        }
        renderCurrentViewPreservingSidebar();
        return;
      }
      if (
        e.target.classList.contains("book-info-custom-label") ||
        e.target.classList.contains("book-info-value") ||
        e.target.classList.contains("text-field-key") ||
        e.target.classList.contains("copyright-field-key")
      ) {
        TPP.renderTextElementControls();
      }
      TPP.renderAll();
    });
    controls.addEventListener("click", function (e) {
      const classificationButton = e.target.closest(
        "[data-book-info-classification]",
      );
      if (classificationButton) {
        TPP.sync("nosave");
        TPP.openClassificationDialog(
          classificationButton.dataset.bookInfoClassification,
        );
        return;
      }
      const colorTrigger = e.target.closest(".color-picker-trigger");
      if (colorTrigger) {
        e.preventDefault();
        e.stopPropagation();
        const input = controls.querySelector(
          '[data-color-input-id="' + colorTrigger.dataset.colorTarget + '"]',
        );
        if (input) TPP.openColorDialog(input);
        return;
      }
      const textButton = e.target.closest("[data-text-action]");
      if (textButton) {
        TPP.sync("nosave");
        const action = textButton.dataset.textAction;
        const group = textButton.closest(".text-element-group");
        if (action === "add")
          TPP.addTextElement(TPP.active, textButton.dataset.location);
        if (action === "remove" && group)
          TPP.removeTextElement(TPP.active, group.dataset.textId);
        TPP.save();
        TPP.renderAll();
        return;
      }
      const openFrontCoverPicker = e.target.closest(
        "#openFrontCoverFieldPicker",
      );
      if (openFrontCoverPicker) {
        TPP.sync("nosave");
        TPP.openFrontCoverFieldDialog();
        return;
      }
      const bookInfoButton = e.target.closest("[data-book-info-action]");
      if (bookInfoButton) {
        TPP.sync("nosave");
        const group = bookInfoButton.closest(".book-info-entry");
        if (group) TPP.removeBookInfoEntry(TPP.active, group.dataset.entryId);
        TPP.save();
        TPP.loadForm();
        renderCurrentViewPreservingSidebar();
        return;
      }
      const copyrightButton = e.target.closest("[data-copyright-action]");
      if (copyrightButton) {
        TPP.sync("nosave");
        const action = copyrightButton.dataset.copyrightAction;
        const group = copyrightButton.closest(".copyright-item-group");
        if (action === "add") TPP.addCopyrightPageItem(TPP.active);
        if (action === "remove" && group)
          TPP.removeCopyrightPageItem(TPP.active, group.dataset.itemId);
        TPP.save();
        TPP.renderAll();
        return;
      }
    });
    controls.addEventListener("mousedown", function (e) {
      const colorTrigger = e.target.closest(".color-picker-trigger");
      if (colorTrigger) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const handle = e.target.closest("[data-drag-handle]");
      if (!handle) {
        dragHandleArmedId = "";
        return;
      }
      const item = handle.closest("[data-drag-kind]");
      dragHandleArmedId =
        (item && (item.dataset.textId || item.dataset.itemId)) || "";
    });
    controls.addEventListener("dragstart", function (e) {
      const item = e.target.closest("[data-drag-kind]");
      const itemId = item && (item.dataset.textId || item.dataset.itemId || "");
      if (!item || !itemId || itemId !== dragHandleArmedId) {
        e.preventDefault();
        return;
      }
      dragState = {
        kind: item.dataset.dragKind,
        location: item.dataset.location || "",
        itemId: item.dataset.textId || item.dataset.itemId || "",
      };
      item.classList.add("is-dragging");
      setDragPreviewLabel(item);
      setFrontCoverTrashVisibility(
        dragState.kind === "text-element" && dragState.location === "front",
      );
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragState.itemId);
        e.dataTransfer.setDragImage(dragPreview, 18, 14);
      }
    });
    controls.addEventListener("dragover", function (e) {
      if (!dragState) return;
      const trashTarget = e.target.closest("#frontCoverTrashDrop");
      if (
        trashTarget &&
        dragState.kind === "text-element" &&
        dragState.location === "front"
      ) {
        e.preventDefault();
        trashTarget.classList.add("is-over");
        return;
      }
      const target = e.target.closest("[data-drag-kind]");
      if (!target || target.classList.contains("is-dragging")) return;
      const sameKind = target.dataset.dragKind === dragState.kind;
      const sameLocation =
        dragState.kind !== "text-element" ||
        (target.dataset.location || "") === dragState.location;
      if (!sameKind || !sameLocation) return;
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const before = e.clientY < rect.top + rect.height / 2;
      const parent = target.parentNode;
      if (!parent) return;
      const dragging = controls.querySelector(".is-dragging");
      if (!dragging || dragging === target) return;
      parent.insertBefore(dragging, before ? target : target.nextSibling);
    });
    controls.addEventListener("dragleave", function (e) {
      const trashTarget = e.target.closest("#frontCoverTrashDrop");
      if (trashTarget) trashTarget.classList.remove("is-over");
    });
    controls.addEventListener("drop", function (e) {
      if (!dragState) return;
      const trashTarget = e.target.closest("#frontCoverTrashDrop");
      if (
        trashTarget &&
        dragState.kind === "text-element" &&
        dragState.location === "front"
      ) {
        e.preventDefault();
        TPP.sync("nosave");
        TPP.removeTextElement(TPP.active, dragState.itemId);
        TPP.save();
        setFrontCoverTrashVisibility(false);
        TPP.renderAll();
        dragState = null;
        return;
      }
      const dragging = controls.querySelector(".is-dragging");
      if (!dragging) return;
      e.preventDefault();
      dragging.classList.remove("is-dragging");
      TPP.sync("commit");
      TPP.renderAll();
      setFrontCoverTrashVisibility(false);
      dragState = null;
    });
    controls.addEventListener("dragend", function () {
      const dragging = controls.querySelector(".is-dragging");
      if (dragging) dragging.classList.remove("is-dragging");
      setFrontCoverTrashVisibility(false);
      dragState = null;
      dragHandleArmedId = "";
    });
  }
  const frontCoverFieldDialog = document.getElementById(
    "frontCoverFieldDialog",
  );
  if (frontCoverFieldDialog) {
    frontCoverFieldDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (
        e.target === frontCoverFieldDialog &&
        !card &&
        frontCoverFieldDialog.open
      ) {
        frontCoverFieldDialog.close("cancel");
        return;
      }
      const closeButton = e.target.closest("[data-action='cancel']");
      if (closeButton && frontCoverFieldDialog.open) {
        frontCoverFieldDialog.close("cancel");
        return;
      }
      const option = e.target.closest("[data-front-cover-field]");
      if (!option) return;
      TPP.sync("nosave");
      TPP.addTextElement(TPP.active, "front", option.dataset.frontCoverField);
      TPP.save();
      if (frontCoverFieldDialog.open) frontCoverFieldDialog.close("selected");
      TPP.loadForm();
      renderCurrentViewPreservingSidebar();
    });
  }
  const classificationDialog = document.getElementById("classificationDialog");
  if (classificationDialog) {
    classificationDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (
        e.target === classificationDialog &&
        !card &&
        classificationDialog.open
      ) {
        classificationDialog.close("cancel");
        return;
      }
      const closeButton = e.target.closest(
        "[data-action='cancel-classification']",
      );
      if (closeButton && classificationDialog.open) {
        classificationDialog.close("cancel");
        return;
      }
      const crumb = e.target.closest("[data-classification-crumb]");
      if (crumb) {
        const raw = crumb.dataset.classificationCrumb || "";
        TPP.classificationDialogPath = raw ? JSON.parse(raw) : [];
        TPP.renderClassificationDialog();
        return;
      }
      const openButton = e.target.closest("[data-classification-open]");
      if (openButton) {
        TPP.classificationDialogPath = JSON.parse(
          openButton.dataset.classificationOpen || "[]",
        );
        TPP.renderClassificationDialog();
        return;
      }
      const selectButton = e.target.closest("[data-classification-select]");
      if (selectButton) {
        TPP.applyClassificationValue(
          selectButton.dataset.classificationSelect || "",
        );
        if (classificationDialog.open) classificationDialog.close("selected");
        return;
      }
      const clearButton = e.target.closest("[data-classification-clear]");
      if (clearButton) {
        TPP.applyClassificationValue("");
        if (classificationDialog.open) classificationDialog.close("cleared");
      }
    });
  }
  const colorPickerPopover = document.getElementById("colorPickerPopover");
  const colorPickerHex = document.getElementById("colorPickerHex");
  const colorPickerSurface = document.getElementById("colorPickerSurface");
  const colorPickerHue = document.getElementById("colorPickerHue");
  if (colorPickerHex) {
    colorPickerHex.addEventListener("input", function () {
      const value = TPP.normalizeHexColor(colorPickerHex.value);
      if (value) TPP.updateColorDialogPreview(value);
    });
  }
  const bindColorPointerField = function (element, onUpdate) {
    if (!element) return;
    let dragging = false;
    const update = function (event) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      onUpdate(TPP.clamp01(x), TPP.clamp01(y));
    };
    element.addEventListener("pointerdown", function (event) {
      dragging = true;
      if (element.setPointerCapture) element.setPointerCapture(event.pointerId);
      update(event);
      event.preventDefault();
    });
    element.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      update(event);
      event.preventDefault();
    });
    element.addEventListener("pointerup", function (event) {
      dragging = false;
      if (
        element.hasPointerCapture &&
        element.hasPointerCapture(event.pointerId)
      )
        element.releasePointerCapture(event.pointerId);
    });
    element.addEventListener("pointercancel", function (event) {
      dragging = false;
      if (
        element.hasPointerCapture &&
        element.hasPointerCapture(event.pointerId)
      )
        element.releasePointerCapture(event.pointerId);
    });
  };
  bindColorPointerField(colorPickerSurface, function (x, y) {
    TPP.colorPickerState.s = x;
    TPP.colorPickerState.v = 1 - y;
    TPP.updateColorDialogPreview(TPP.colorFromPickerState());
  });
  bindColorPointerField(colorPickerHue, function (x) {
    TPP.colorPickerState.h = x * 360;
    TPP.updateColorDialogPreview(TPP.colorFromPickerState());
  });
  if (colorPickerPopover) {
    colorPickerPopover.addEventListener("click", function (e) {
      const swatch = e.target.closest("[data-dialog-color]");
      if (swatch) {
        TPP.updateColorDialogPreview(swatch.dataset.dialogColor || "#000000");
      }
    });
  }
  document.addEventListener("keydown", function (event) {
    const popover = document.getElementById("colorPickerPopover");
    if (!popover || popover.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      TPP.closeColorDialog();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const hex = document.getElementById("colorPickerHex");
      const value = TPP.normalizeHexColor(hex && hex.value);
      if (value) TPP.updateColorDialogPreview(value);
      TPP.closeColorDialog();
    }
  });
  document.addEventListener("mousedown", function (e) {
    const popover = document.getElementById("colorPickerPopover");
    if (!popover || popover.hidden) return;
    const trigger = e.target.closest(".color-picker-trigger");
    if (trigger) return;
    if (!e.target.closest("#colorPickerPopover")) TPP.closeColorDialog();
  });
  window.addEventListener("resize", TPP.positionColorPopover);
  window.addEventListener("scroll", TPP.positionColorPopover, true);
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
  const bookInfoAddButton = document.getElementById("bookInfoAddButton");
  if (bookInfoAddButton) {
    bookInfoAddButton.onclick = function () {
      const select = document.getElementById("bookInfoAddField");
      const value = select && select.value;
      if (!value) return;
      TPP.sync("nosave");
      TPP.addBookInfoEntry(TPP.active, value);
      TPP.save();
      TPP.loadForm();
      renderCurrentViewPreservingSidebar();
    };
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

  const createNewBook = function () {
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
  const libraryNewBookButton = document.getElementById("libraryNewBook");
  if (libraryNewBookButton) libraryNewBookButton.onclick = createNewBook;

  const duplicateActiveBook = function () {
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
  const aboutDuplicateBookButton =
    document.getElementById("aboutDuplicateBook");
  if (aboutDuplicateBookButton)
    aboutDuplicateBookButton.onclick = duplicateActiveBook;

  const deleteActiveBook = function () {
    if (TPP.library.length <= 1) return alert("Keep at least one book.");
    if (confirm("Delete this book?")) {
      TPP.library = TPP.library.filter(function (book) {
        return TPP.bookId(book) !== TPP.bookId(TPP.active);
      });
      TPP.save();
      TPP.setActive(TPP.library[0]);
    }
  };
  const aboutDeleteBookButton = document.getElementById("aboutDeleteBook");
  if (aboutDeleteBookButton) aboutDeleteBookButton.onclick = deleteActiveBook;

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
  const libraryUploadDialog = document.getElementById("libraryUploadDialog");
  const openLibraryUploadDialog = function () {
    const input = document.getElementById("importJson");
    if (!input) return;
    input.value = "";
    if (
      libraryUploadDialog &&
      typeof libraryUploadDialog.showModal === "function"
    ) {
      libraryUploadDialog.showModal();
    }
  };
  const libraryUploadBookButton = document.getElementById("libraryUploadBook");
  if (libraryUploadBookButton)
    libraryUploadBookButton.onclick = openLibraryUploadDialog;
  if (libraryUploadDialog) {
    libraryUploadDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === libraryUploadDialog && !card && libraryUploadDialog.open)
        libraryUploadDialog.close("cancel");
      const closeButton = e.target.closest("[data-action='cancel']");
      if (closeButton) libraryUploadDialog.close("cancel");
    });
  }
  document.getElementById("libraryGrid").onclick = function (e) {
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const book = TPP.library.find(function (b) {
      return TPP.bookId(b) === card.dataset.id;
    });
    if (!book) return;
    const cover = e.target.closest(".library-cover");
    if (cover) {
      TPP.setActive(book);
      TPP.switchView("editor");
      return;
    }
    const button = e.target.closest("[data-act]");
    if (!button) return;
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
  TPP.prepareBrowserPrint = function () {
    if (TPP.view !== "interior") return null;
    const interiorPreview = document.getElementById("interiorPreview");
    const coverPreview = document.getElementById("coverPreview");
    if (!interiorPreview || !coverPreview) return null;
    TPP.renderCover();
    const coverSheet = coverPreview.querySelector(".sheet");
    if (!coverSheet) return null;
    const clone = coverSheet.cloneNode(true);
    clone.classList.add("print-extra-cover-page");
    clone.querySelectorAll(".sheet-title").forEach(function (title) {
      title.textContent = "Cover print sheet";
    });
    interiorPreview.appendChild(clone);
    return function cleanupPrintCoverPage() {
      const node = interiorPreview.querySelector(".print-extra-cover-page");
      if (node) node.remove();
    };
  };
  document.getElementById("printBrowser").onclick = function () {
    const cleanup = TPP.prepareBrowserPrint();
    const finalize = function () {
      window.removeEventListener("afterprint", finalize);
      if (typeof cleanup === "function") cleanup();
    };
    window.addEventListener("afterprint", finalize);
    setTimeout(function () {
      print();
      setTimeout(function () {
        finalize();
      }, 180);
    }, 80);
  };
  const downloadActiveBook = function () {
    TPP.sync();
    TPP.markBookExported(TPP.active);
    TPP.save();
    TPP.download(TPP.bookExportName(TPP.active), {
      type: "tiny-pockets-book",
      schemaVersion: TPP.SCHEMA_VERSION,
      book: TPP.active,
    });
  };
  const aboutDownloadBookButton = document.getElementById("aboutDownloadBook");
  if (aboutDownloadBookButton)
    aboutDownloadBookButton.onclick = downloadActiveBook;
  const downloadLibrary = function () {
    const stamp = TPP.nowIso();
    TPP.library.forEach(function (book) {
      TPP.markBookExported(book, stamp);
    });
    TPP.save();
    TPP.download("tiny-pockets-library.library", {
      type: "tiny-pockets-library",
      schemaVersion: TPP.SCHEMA_VERSION,
      books: TPP.library,
    });
  };
  const libraryDownloadLibraryButton = document.getElementById(
    "libraryDownloadLibrary",
  );
  if (libraryDownloadLibraryButton)
    libraryDownloadLibraryButton.onclick = downloadLibrary;
  document.getElementById("importJson").onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (libraryUploadDialog && libraryUploadDialog.open)
      libraryUploadDialog.close("selected");
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
  const imageExportPaletteWrap = document.getElementById(
    "imageExportDialogPaletteWrap",
  );
  const imageExportPalette = document.getElementById(
    "imageExportDialogPalette",
  );
  const imageExportPalettePreview = document.getElementById(
    "imageExportPalettePreview",
  );
  const imageExportPalettePreviewCanvas = document.getElementById(
    "imageExportPalettePreviewCanvas",
  );
  const imageExportPaletteDialog = document.getElementById(
    "imageExportPaletteDialog",
  );
  const imageExportPaletteDialogTitle = document.getElementById(
    "imageExportPaletteDialogTitle",
  );
  const imageExportPaletteDialogCanvas = document.getElementById(
    "imageExportPaletteDialogCanvas",
  );
  const imageExportPaletteSample = document.getElementById(
    "imageExportPaletteSample",
  );
  const imageExportPaletteHex = document.getElementById(
    "imageExportPaletteHex",
  );
  const imageExportPaletteRgb = document.getElementById(
    "imageExportPaletteRgb",
  );
  const imageExportPaletteHsv = document.getElementById(
    "imageExportPaletteHsv",
  );
  const imageExportPaletteLch = document.getElementById(
    "imageExportPaletteLch",
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
  const imageExportDownloadBefore = document.getElementById(
    "imageExportDownloadBefore",
  );
  const imageExportDownloadAfter = document.getElementById(
    "imageExportDownloadAfter",
  );
  const imageExportPreviewDuration = document.getElementById(
    "imageExportPreviewDuration",
  );
  const imageExportPreviewPlay = document.getElementById(
    "imageExportPreviewPlay",
  );
  const imageExportFrameDelay = document.getElementById(
    "imageExportFrameDelay",
  );
  const imageExportAnimatedGif = imageExportDialog
    ? imageExportDialog.querySelector("[data-action='export-animated-gif']")
    : null;
  const imageExportMp4 = imageExportDialog
    ? imageExportDialog.querySelector("[data-action='export-mp4']")
    : null;
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
    imageExportPaletteWrap &&
    imageExportPalette &&
    imageExportPalettePreview &&
    imageExportPalettePreviewCanvas &&
    imageExportPaletteDialog &&
    imageExportPaletteDialogTitle &&
    imageExportPaletteDialogCanvas &&
    imageExportPaletteSample &&
    imageExportPaletteHex &&
    imageExportPaletteRgb &&
    imageExportPaletteHsv &&
    imageExportPaletteLch &&
    imageExportThresholdWrap &&
    imageExportThreshold &&
    imageExportThresholdValue &&
    imageExportEstimate &&
    imageExportPreviewPrev &&
    imageExportPreviewNext &&
    imageExportDownloadBefore &&
    imageExportDownloadAfter &&
    imageExportPreviewDuration &&
    imageExportPreviewPlay &&
    imageExportFrameDelay &&
    imageExportAnimatedGif &&
    imageExportMp4
  ) {
    const presetValues = ["72", "96", "150", "200", "300", "600"];
    const saveImageExportUi = function (patch) {
      const previous = TPP.imageExportUi();
      const dpiValue = TPP.dpi(Number(imageExportDpi.value) || 300);
      const presetValue = imageExportPreset.value || "300";
      const nextPatch = Object.assign({}, patch || {});
      if (!Object.prototype.hasOwnProperty.call(nextPatch, "customDpi")) {
        nextPatch.customDpi =
          presetValue === "custom"
            ? dpiValue
            : TPP.dpi(previous.customDpi || previous.dpi || 300);
      }
      TPP.writeImageExportUi(
        Object.assign(
          {
            dpiPreset: presetValue,
            customDpi: nextPatch.customDpi,
            dpi: dpiValue,
            format: imageExportFormat.value || "png",
            quality: Math.max(
              1,
              Math.min(100, Number(imageExportQuality.value) || 92),
            ),
            colorDepth: imageExportColorDepth.value || "color24",
            palette: imageExportPalette.value || "websafe",
            threshold: Math.max(
              0,
              Math.min(255, Number(imageExportThreshold.value) || 128),
            ),
            frameDelay: TPP.imageExportFrameDelayMs(
              imageExportFrameDelay.value,
            ),
          },
          nextPatch,
        ),
      );
    };
    const paletteGrid = function (count) {
      const total = Math.max(1, Number(count) || 1);
      const exact = {
        1: [1, 1],
        2: [2, 1],
        4: [2, 2],
        8: [4, 2],
        16: [4, 4],
        32: [8, 4],
        64: [8, 8],
        128: [16, 8],
        256: [16, 16],
      };
      if (exact[total]) return { cols: exact[total][0], rows: exact[total][1] };
      const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
      return { cols: cols, rows: Math.max(1, Math.ceil(total / cols)) };
    };
    const paletteHex = function (swatch) {
      return (
        "#" +
        swatch
          .map(function (value) {
            return Math.max(0, Math.min(255, Number(value) || 0))
              .toString(16)
              .padStart(2, "0");
          })
          .join("")
      );
    };
    const paletteHsv = function (swatch) {
      const r = swatch[0] / 255;
      const g = swatch[1] / 255;
      const b = swatch[2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      if (delta) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = Math.round((h * 60 + 360) % 360);
      const s = max === 0 ? 0 : (delta / max) * 100;
      const v = max * 100;
      return "hsv(" + h + ", " + s.toFixed(1) + "%, " + v.toFixed(1) + "%)";
    };
    const paletteLch = function (swatch) {
      const srgb = swatch.map(function (value) {
        const channel = value / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : Math.pow((channel + 0.055) / 1.055, 2.4);
      });
      const x = srgb[0] * 0.4124564 + srgb[1] * 0.3575761 + srgb[2] * 0.1804375;
      const y = srgb[0] * 0.2126729 + srgb[1] * 0.7151522 + srgb[2] * 0.072175;
      const z = srgb[0] * 0.0193339 + srgb[1] * 0.119192 + srgb[2] * 0.9503041;
      const xr = x / 0.95047;
      const yr = y / 1;
      const zr = z / 1.08883;
      const f = function (value) {
        return value > 0.008856 ? Math.cbrt(value) : (903.3 * value + 16) / 116;
      };
      const fx = f(xr);
      const fy = f(yr);
      const fz = f(zr);
      const l = 116 * fy - 16;
      const a = 500 * (fx - fy);
      const b = 200 * (fy - fz);
      const c = Math.sqrt(a * a + b * b);
      const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
      return (
        "lch(" + l.toFixed(2) + "% " + c.toFixed(2) + " " + h.toFixed(2) + ")"
      );
    };
    const paletteGridLayout = function (paletteName, options) {
      const palette = TPP.imageExportNamedPalette(paletteName || "websafe");
      const grid = paletteGrid(palette.length || 1);
      return {
        palette: palette,
        grid: grid,
        options: Object.assign(
          {
            gap: 0,
            border: false,
            padding: 0,
          },
          options || {},
        ),
      };
    };
    const paletteSelectionInfo = function (layout, canvas, clientX, clientY) {
      if (!layout || !canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const padding = layout.options.padding;
      const gap = layout.options.gap;
      const innerWidth = Math.max(1, canvas.width - padding * 2);
      const innerHeight = Math.max(1, canvas.height - padding * 2);
      const cellWidth = innerWidth / layout.grid.cols;
      const cellHeight = innerHeight / layout.grid.rows;
      const relX = x - padding;
      const relY = y - padding;
      if (relX < 0 || relY < 0 || relX > innerWidth || relY > innerHeight)
        return null;
      const col = Math.floor(relX / cellWidth);
      const row = Math.floor(relY / cellHeight);
      const cellX = col * cellWidth + gap / 2;
      const cellY = row * cellHeight + gap / 2;
      const cellW = Math.max(1, cellWidth - gap);
      const cellH = Math.max(1, cellHeight - gap);
      if (
        relX < cellX ||
        relY < cellY ||
        relX > cellX + cellW ||
        relY > cellY + cellH
      )
        return null;
      const index = row * layout.grid.cols + col;
      if (index < 0 || index >= layout.palette.length) return null;
      return index;
    };
    const updatePaletteInspector = function (swatch) {
      if (!swatch) return;
      imageExportPaletteSample.style.background =
        "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
      imageExportPaletteHex.value = paletteHex(swatch);
      imageExportPaletteRgb.value =
        "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
      imageExportPaletteHsv.value = paletteHsv(swatch);
      imageExportPaletteLch.value = paletteLch(swatch);
    };
    const drawPalettePreview = function (canvas, paletteName, options) {
      if (!canvas || !TPP.imageExportNamedPalette) return;
      const layout = paletteGridLayout(paletteName, options);
      const palette = layout.palette;
      const width = Number(canvas.width) || 16;
      const height = Number(canvas.height) || 16;
      const cols = layout.grid.cols;
      const rows = layout.grid.rows;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const opts = layout.options;
      const gap = Math.max(0, Number(opts.gap) || 0);
      const padding = Math.max(0, Number(opts.padding) || 0);
      const innerWidth = Math.max(1, width - padding * 2);
      const innerHeight = Math.max(1, height - padding * 2);
      const cellWidth = innerWidth / cols;
      const cellHeight = innerHeight / rows;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f8f2e6";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < palette.length; i++) {
        const swatch = palette[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * cellWidth + gap / 2;
        const y = padding + row * cellHeight + gap / 2;
        const w = Math.max(1, cellWidth - gap);
        const h = Math.max(1, cellHeight - gap);
        ctx.fillStyle =
          "rgb(" + swatch[0] + ", " + swatch[1] + ", " + swatch[2] + ")";
        ctx.fillRect(x, y, w, h);
        if (opts.border) {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            x + 0.5,
            y + 0.5,
            Math.max(0, w - 1),
            Math.max(0, h - 1),
          );
        }
        if (Number(opts.selectedIndex) === i) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 2, y + 2, Math.max(0, w - 4), Math.max(0, h - 4));
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, Math.max(0, w - 8), Math.max(0, h - 8));
        }
      }
    };
    const openPalettePreview = function () {
      if (
        !imageExportPaletteDialog ||
        !imageExportPaletteDialogTitle ||
        !imageExportPaletteDialogCanvas ||
        !imageExportPaletteSample ||
        !imageExportPaletteHex ||
        !imageExportPaletteRgb ||
        !imageExportPaletteHsv ||
        !imageExportPaletteLch ||
        typeof imageExportPaletteDialog.showModal !== "function"
      )
        return;
      const paletteName = imageExportPalette.value || "websafe";
      const layout = paletteGridLayout(paletteName, {
        gap: 6,
        border: true,
        padding: 8,
        selectedIndex: Math.max(
          0,
          Number(TPP.imageExportPaletteSelectedIndex) || 0,
        ),
      });
      const palette = layout.palette;
      const grid = layout.grid;
      TPP.imageExportPaletteSelectedIndex = Math.min(
        Math.max(0, Number(TPP.imageExportPaletteSelectedIndex) || 0),
        Math.max(0, palette.length - 1),
      );
      layout.options.selectedIndex = TPP.imageExportPaletteSelectedIndex;
      const cellSize = Math.max(28, Math.min(64, Math.floor(640 / grid.cols)));
      imageExportPaletteDialogCanvas.width = grid.cols * cellSize + 16;
      imageExportPaletteDialogCanvas.height = grid.rows * cellSize + 16;
      TPP.imageExportPaletteDialogLayout = layout;
      drawPalettePreview(
        imageExportPaletteDialogCanvas,
        paletteName,
        layout.options,
      );
      imageExportPaletteDialogTitle.textContent =
        (imageExportPalette.selectedOptions[0]
          ? imageExportPalette.selectedOptions[0].textContent
          : "Palette") + " Preview";
      updatePaletteInspector(
        palette[TPP.imageExportPaletteSelectedIndex] || palette[0],
      );
      if (!imageExportPaletteDialog.open) imageExportPaletteDialog.showModal();
    };
    const syncPalettePreview = function () {
      drawPalettePreview(
        imageExportPalettePreviewCanvas,
        imageExportPalette.value || "websafe",
        { gap: 0, border: false, padding: 0 },
      );
      imageExportPalettePreview.disabled = imageExportPalette.disabled;
      imageExportPalettePreview.classList.toggle(
        "is-disabled",
        imageExportPalette.disabled,
      );
    };
    const syncPresetUi = function () {
      const preset = imageExportPreset.value;
      imageExportCustomWrap.hidden = preset !== "custom";
      if (preset !== "custom") imageExportDpi.value = preset;
    };
    const syncFormatUi = function () {
      const indexedOnly = imageExportColorDepth.value === "indexed";
      Array.from(imageExportFormat.options).forEach(function (option) {
        option.disabled = indexedOnly && !["png", "gif"].includes(option.value);
      });
      if (indexedOnly && !["png", "gif"].includes(imageExportFormat.value))
        imageExportFormat.value = "png";
      const lossy =
        imageExportFormat.value === "jpeg" ||
        imageExportFormat.value === "webp";
      const colorDepthApplies = ["png", "gif", "jpeg", "webp"].includes(
        imageExportFormat.value,
      );
      imageExportQuality.disabled = !lossy;
      imageExportQualityWrap.classList.toggle("is-disabled", !lossy);
      imageExportAnimatedGif.disabled = imageExportFormat.value !== "gif";
      imageExportMp4.disabled = typeof window.VideoEncoder !== "function";
      imageExportColorDepth.disabled = !colorDepthApplies;
      imageExportColorDepth.parentElement.classList.toggle(
        "is-disabled",
        !colorDepthApplies,
      );
      imageExportPalette.disabled = !indexedOnly;
      imageExportPaletteWrap.classList.toggle("is-disabled", !indexedOnly);
      const mono = imageExportColorDepth.value === "mono1";
      imageExportThreshold.disabled = !mono;
      imageExportThresholdWrap.classList.toggle("is-disabled", !mono);
      imageExportQualityValue.textContent =
        Math.max(1, Math.min(100, Number(imageExportQuality.value) || 92)) +
        "%";
      imageExportThresholdValue.textContent = String(
        Math.max(0, Math.min(255, Number(imageExportThreshold.value) || 128)),
      );
      syncPalettePreview();
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
      TPP.scheduleImageExportPreview();
    };
    const syncPlaybackUi = function () {
      imageExportPreviewPlay.textContent = TPP.imageExportPreviewPlaying
        ? "⏸ Pause"
        : "▶ Play";
    };
    const stopPlayback = function () {
      clearTimeout(TPP.imageExportPreviewPlaybackTimer);
      TPP.imageExportPreviewPlaybackTimer = null;
      TPP.imageExportPreviewPlaying = false;
      syncPlaybackUi();
    };
    const schedulePlayback = function () {
      clearTimeout(TPP.imageExportPreviewPlaybackTimer);
      if (!TPP.imageExportPreviewPlaying || !imageExportDialog.open) return;
      const delay = TPP.imageExportFrameDelayMs(imageExportFrameDelay.value);
      TPP.imageExportPreviewPlaybackTimer = setTimeout(function () {
        TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(1);
        TPP.renderImageExportPreview();
        schedulePlayback();
      }, delay);
    };
    const refreshPlayback = function () {
      syncPlaybackUi();
      if (TPP.imageExportPreviewPlaying) schedulePlayback();
    };
    imageExportPreset.addEventListener("change", function () {
      syncPresetUi();
      saveImageExportUi();
      updateEstimate();
      schedulePreview();
    });
    imageExportFormat.addEventListener("change", function () {
      syncFormatUi();
      saveImageExportUi();
      schedulePreview();
    });
    imageExportColorDepth.addEventListener("change", function () {
      syncFormatUi();
      saveImageExportUi();
      schedulePreview();
    });
    imageExportQuality.addEventListener("input", function () {
      syncFormatUi();
      saveImageExportUi();
      schedulePreview();
    });
    imageExportPalette.addEventListener("change", function () {
      syncFormatUi();
      saveImageExportUi();
      if (imageExportPaletteDialog.open) openPalettePreview();
      schedulePreview();
    });
    imageExportThreshold.addEventListener("input", function () {
      syncFormatUi();
      saveImageExportUi();
      schedulePreview();
    });
    imageExportFrameDelay.addEventListener("input", function () {
      imageExportFrameDelay.value = TPP.imageExportFrameDelaySeconds(
        TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
      );
      saveImageExportUi();
      TPP.updateImageExportDuration();
      refreshPlayback();
    });
    imageExportDpi.addEventListener("input", function () {
      saveImageExportUi({
        dpiPreset: "custom",
        customDpi: TPP.dpi(Number(imageExportDpi.value) || 300),
      });
      updateEstimate();
      schedulePreview();
    });
    imageExportPalettePreview.addEventListener("click", openPalettePreview);
    imageExportPaletteDialogCanvas.addEventListener("click", function (event) {
      const layout = TPP.imageExportPaletteDialogLayout;
      const index = paletteSelectionInfo(
        layout,
        imageExportPaletteDialogCanvas,
        event.clientX,
        event.clientY,
      );
      if (index == null) return;
      TPP.imageExportPaletteSelectedIndex = index;
      openPalettePreview();
    });
    imageExportPaletteDialog.addEventListener("keydown", function (event) {
      if (!imageExportPaletteDialog.open) return;
      const layout = TPP.imageExportPaletteDialogLayout;
      if (!layout || !layout.grid || !layout.palette || !layout.palette.length)
        return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const count = layout.palette.length;
      const cols = Math.max(1, Number(layout.grid.cols) || 1);
      const rows = Math.max(1, Number(layout.grid.rows) || 1);
      const current = Math.max(
        0,
        Math.min(count - 1, Number(TPP.imageExportPaletteSelectedIndex) || 0),
      );
      const row = Math.floor(current / cols);
      const col = current % cols;
      let next = current;
      const rowEndIndex = function (rowIndex) {
        const start = rowIndex * cols;
        return Math.min(count - 1, start + cols - 1);
      };
      if (event.key === "ArrowRight") {
        next = (current + 1) % count;
      } else if (event.key === "ArrowLeft") {
        next = (current - 1 + count) % count;
      } else if (event.key === "ArrowDown") {
        const nextRow = (row + 1) % rows;
        const start = nextRow * cols;
        next = Math.min(start + col, rowEndIndex(nextRow));
      } else if (event.key === "ArrowUp") {
        const nextRow = (row - 1 + rows) % rows;
        const start = nextRow * cols;
        next = Math.min(start + col, rowEndIndex(nextRow));
      } else {
        return;
      }
      event.preventDefault();
      TPP.imageExportPaletteSelectedIndex = next;
      openPalettePreview();
    });
    imageExportPreviewPrev.addEventListener("click", function () {
      TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(-1);
      TPP.renderImageExportPreview();
      refreshPlayback();
    });
    imageExportPreviewNext.addEventListener("click", function () {
      TPP.imageExportPreviewIndex = TPP.nextImageExportPreviewIndex(1);
      TPP.renderImageExportPreview();
      refreshPlayback();
    });
    imageExportPreviewPlay.addEventListener("click", function () {
      TPP.imageExportPreviewPlaying = !TPP.imageExportPreviewPlaying;
      if (!TPP.imageExportPreviewPlaying) {
        stopPlayback();
        return;
      }
      refreshPlayback();
    });
    imageExportDownloadBefore.addEventListener("click", function () {
      TPP.downloadImageExportPreview("before");
    });
    imageExportDownloadAfter.addEventListener("click", function () {
      TPP.downloadImageExportPreview("after");
    });
    imageExportDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (e.target === imageExportDialog && !card && imageExportDialog.open) {
        stopPlayback();
        imageExportDialog.close();
        return;
      }
      const button = e.target.closest("[data-action]");
      if (!button) return;
      if (button.dataset.action === "cancel" && imageExportDialog.open) {
        stopPlayback();
        imageExportDialog.close();
        return;
      }
      if (
        button.dataset.action === "export-images" ||
        button.dataset.action === "export-animated-gif" ||
        button.dataset.action === "export-mp4"
      ) {
        const dpi = TPP.dpi(Number(imageExportDpi.value) || 300);
        const format = imageExportFormat.value || "png";
        const quality = Math.max(
          1,
          Math.min(100, Number(imageExportQuality.value) || 92),
        );
        const colorDepth = imageExportColorDepth.value || "color24";
        const palette = imageExportPalette.value || "websafe";
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
        saveImageExportUi({
          dpiPreset: imageExportPreset.value || "300",
          customDpi: TPP.dpi(Number(imageExportDpi.value) || dpi),
          dpi: dpi,
          format: format,
          quality: quality,
          colorDepth: colorDepth,
          palette: palette,
          threshold: threshold,
          frameDelay: TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
        });
        stopPlayback();
        if (imageExportDialog.open) imageExportDialog.close();
        const exportOptions = {
          dpi: dpi,
          format: format,
          quality: quality,
          colorDepth: colorDepth,
          palette: palette,
          threshold: threshold,
          frameDelay: TPP.imageExportFrameDelayMs(imageExportFrameDelay.value),
        };
        if (button.dataset.action === "export-animated-gif") {
          TPP.exportAnimatedGif(exportOptions);
        } else if (button.dataset.action === "export-mp4") {
          TPP.exportMp4(exportOptions);
        } else {
          TPP.exportImagesZip(exportOptions);
        }
      }
    });
    imageExportDialog.addEventListener("close", stopPlayback);
    imageExportPaletteDialog.addEventListener("click", function (e) {
      const card = e.target.closest(".modal-card");
      if (
        e.target === imageExportPaletteDialog &&
        !card &&
        imageExportPaletteDialog.open
      ) {
        imageExportPaletteDialog.close();
        return;
      }
      const closeButton = e.target.closest("[data-action='close']");
      if (closeButton && imageExportPaletteDialog.open)
        imageExportPaletteDialog.close();
    });
    syncPlaybackUi();
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
  const palette = document.getElementById("imageExportDialogPalette");
  const paletteWrap = document.getElementById("imageExportDialogPaletteWrap");
  const frameDelay = document.getElementById("imageExportFrameDelay");
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
    !palette ||
    !paletteWrap ||
    !frameDelay ||
    !threshold ||
    !thresholdWrap ||
    !thresholdValue ||
    typeof dialog.showModal !== "function"
  )
    return;
  const ui = TPP.imageExportUi();
  const presetValues = ["72", "96", "150", "200", "300", "600"];
  const dpiPreset =
    ui.dpiPreset === "custom"
      ? "custom"
      : presetValues.includes(String(ui.dpiPreset))
        ? String(ui.dpiPreset)
        : presetValues.includes(String(ui.dpi || 300))
          ? String(ui.dpi || 300)
          : "custom";
  const customDpi = TPP.dpi(ui.customDpi || ui.dpi || 300);
  const dpi = dpiPreset === "custom" ? customDpi : TPP.dpi(dpiPreset);
  input.value = dpi;
  colorDepth.value =
    ui.colorDepth === "websafe" ? "indexed" : ui.colorDepth || "color24";
  format.value =
    colorDepth.value === "indexed" && !["png", "gif"].includes(ui.format)
      ? "png"
      : ui.format || "png";
  quality.value = Math.max(1, Math.min(100, Number(ui.quality) || 92));
  palette.value =
    ui.palette || (ui.colorDepth === "websafe" ? "websafe" : "websafe");
  frameDelay.value = TPP.imageExportFrameDelaySeconds(ui.frameDelay || 300);
  threshold.value = Math.max(0, Math.min(255, Number(ui.threshold) || 128));
  qualityValue.textContent = quality.value + "%";
  thresholdValue.textContent = threshold.value;
  preset.value = dpiPreset;
  customWrap.hidden = preset.value !== "custom";
  if (TPP.syncImageExportFormatUi) TPP.syncImageExportFormatUi();
  if (TPP.updateImageExportEstimate) TPP.updateImageExportEstimate();
  TPP.updateImageExportDuration();
  TPP.imageExportPreviewIndex = 0;
  TPP.imageExportPreviewPlaying = false;
  dialog.showModal();
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(function () {
      TPP.scheduleImageExportPreview();
    });
  } else {
    TPP.scheduleImageExportPreview();
  }
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
  return [
    "editor",
    "about",
    "software",
    "data",
    "interior",
    "cover",
    "reader",
    "library",
  ];
};
TPP.toast = function (message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  clearTimeout(TPP.toastTimer);
  toast.textContent = message;
  if (toast.open && typeof toast.close === "function") toast.close();
  if (typeof toast.showModal === "function") toast.showModal();
  toast.classList.add("show");
  TPP.toastTimer = setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      if (toast.open && typeof toast.close === "function") toast.close();
    }, 180);
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
      dpiPreset: "300",
      customDpi: 300,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
    },
    state.imageExport || {},
  );
};
TPP.writeImageExportUi = function (patch) {
  const state = TPP.readSettingsUi();
  const imageExport = Object.assign(
    {
      dpi: 300,
      dpiPreset: "300",
      customDpi: 300,
      format: "png",
      quality: 92,
      colorDepth: "color24",
      threshold: 128,
      frameDelay: 300,
      palette: "websafe",
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
TPP.imageExportPreviewSplit = 50;
TPP.imageExportPreviewAssets = null;
TPP.imageExportPreviewPlaying = false;
TPP.imageExportFrameDelayMs = function (value) {
  return Math.max(
    1000,
    Math.min(10000, Math.round((Number(value) || 1) * 1000)),
  );
};
TPP.imageExportFrameDelaySeconds = function (value) {
  const ms = Math.max(1000, Math.min(10000, Number(value) || 1000));
  return (ms / 1000).toFixed(1).replace(/\.0$/, "");
};
TPP.imageExportDurationText = function (pageCount, frameDelayMs) {
  const totalSeconds =
    Math.max(0, Number(pageCount) || 0) *
    (Math.max(1000, Math.min(10000, Number(frameDelayMs) || 1000)) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsLabel = Number.isInteger(seconds)
    ? String(seconds)
    : seconds.toFixed(1).replace(/\.0$/, "");
  if (minutes <= 0)
    return secondsLabel + " second" + (Number(secondsLabel) === 1 ? "" : "s");
  return (
    minutes +
    " minute" +
    (minutes === 1 ? "" : "s") +
    " " +
    secondsLabel +
    " second" +
    (Number(secondsLabel) === 1 ? "" : "s")
  );
};
TPP.updateImageExportDuration = function (pageCount) {
  const el = document.getElementById("imageExportPreviewDuration");
  const input = document.getElementById("imageExportFrameDelay");
  if (!el || !input) return;
  const count =
    Number(pageCount) ||
    Number(TPP.imageExportPreviewPageCount) ||
    TPP.buildPages().length;
  el.textContent =
    "Total duration: " +
    TPP.imageExportDurationText(
      count,
      TPP.imageExportFrameDelayMs(input.value),
    );
};
TPP.nextImageExportPreviewIndex = function (step) {
  const count = TPP.buildPages().length;
  if (!count) return 0;
  const delta = Number(step) || 0;
  return (
    ((((Number(TPP.imageExportPreviewIndex) || 0) + delta) % count) + count) %
    count
  );
};
TPP.cancelImageExportPreviewSchedule = function () {
  clearTimeout(TPP.imageExportPreviewTimer);
  TPP.imageExportPreviewTimer = null;
  if (
    TPP.imageExportPreviewIdle &&
    typeof window.cancelIdleCallback === "function"
  ) {
    window.cancelIdleCallback(TPP.imageExportPreviewIdle);
    TPP.imageExportPreviewIdle = null;
  }
};
TPP.scheduleImageExportPreview = function () {
  TPP.cancelImageExportPreviewSchedule();
  TPP.imageExportPreviewTimer = setTimeout(function () {
    TPP.imageExportPreviewTimer = null;
    const run = function () {
      TPP.imageExportPreviewIdle = null;
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(function () {
          TPP.renderImageExportPreview();
        });
      } else {
        window.setTimeout(function () {
          TPP.renderImageExportPreview();
        }, 0);
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      TPP.imageExportPreviewIdle = window.requestIdleCallback(run, {
        timeout: 400,
      });
      return;
    }
    window.requestAnimationFrame(run);
  }, 180);
};
TPP.revokeImageExportPreviewAssets = function (assets) {
  ["before", "after"].forEach(function (key) {
    const entry = assets && assets[key];
    if (entry && entry.src && String(entry.src).startsWith("blob:"))
      URL.revokeObjectURL(entry.src);
  });
};
TPP.setImageExportPreviewDownloads = function (assets) {
  TPP.revokeImageExportPreviewAssets(TPP.imageExportPreviewAssets);
  TPP.imageExportPreviewAssets = assets || null;
  const beforeButton = document.getElementById("imageExportDownloadBefore");
  const afterButton = document.getElementById("imageExportDownloadAfter");
  if (beforeButton) beforeButton.disabled = !(assets && assets.before);
  if (afterButton) afterButton.disabled = !(assets && assets.after);
};
TPP.downloadImageExportPreview = async function (which) {
  const assets = TPP.imageExportPreviewAssets;
  const entry =
    which === "after" ? assets && assets.after : assets && assets.before;
  if (!entry || !entry.blob || !entry.name) return;
  try {
    TPP.downloadBlob(entry.name, entry.blob);
  } catch (_error) {
    TPP.toast("Unable to download preview image.");
  }
};
TPP.applyImageExportPreviewSplit = function (split) {
  const compare = document.querySelector(
    "#imageExportPreviewStage .image-export-compare",
  );
  if (!compare) return;
  const normalized = Math.max(0, Math.min(100, Number(split) || 50));
  TPP.imageExportPreviewSplit = normalized;
  const after = compare.querySelector(".image-export-compare-after");
  const divider = compare.querySelector(".image-export-compare-divider");
  if (after) after.style.clipPath = "inset(0 0 0 " + normalized + "%)";
  if (divider) divider.style.left = normalized + "%";
};
TPP.bindImageExportPreviewDrag = function () {
  const compare = document.querySelector(
    "#imageExportPreviewStage .image-export-compare",
  );
  if (!compare) return;
  let dragging = false;
  const update = function (clientX) {
    const rect = compare.getBoundingClientRect();
    if (!rect.width) return;
    const split = ((clientX - rect.left) / rect.width) * 100;
    TPP.applyImageExportPreviewSplit(split);
  };
  compare.onpointerdown = function (event) {
    dragging = true;
    compare.setPointerCapture(event.pointerId);
    update(event.clientX);
  };
  compare.onpointermove = function (event) {
    if (!dragging) return;
    update(event.clientX);
  };
  compare.onpointerup = function (event) {
    dragging = false;
    if (compare.hasPointerCapture(event.pointerId))
      compare.releasePointerCapture(event.pointerId);
  };
  compare.onpointercancel = function (event) {
    dragging = false;
    if (compare.hasPointerCapture(event.pointerId))
      compare.releasePointerCapture(event.pointerId);
  };
  TPP.applyImageExportPreviewSplit(TPP.imageExportPreviewSplit);
};
TPP.renderImageExportPreview = async function () {
  await TPP.ensureImageExportPalettesLoaded();
  const dialog = document.getElementById("imageExportDialog");
  const stage = document.getElementById("imageExportPreviewStage");
  const label = document.getElementById("imageExportPreviewLabel");
  const format = document.getElementById("imageExportDialogFormat");
  const colorDepth = document.getElementById("imageExportDialogColorDepth");
  const quality = document.getElementById("imageExportDialogQuality");
  const palette = document.getElementById("imageExportDialogPalette");
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
    !palette ||
    !threshold ||
    !thresholdValue ||
    !dpi ||
    !TPP.renderImageExportPreviewCanvas
  )
    return;
  await Promise.resolve();
  TPP.sync("nosave");
  const pages = TPP.buildPages();
  TPP.imageExportPreviewPageCount = pages.length;
  TPP.updateImageExportDuration(pages.length);
  if (!pages.length) {
    TPP.setImageExportPreviewDownloads(null);
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
  TPP.setImageExportPreviewDownloads(null);
  stage.innerHTML =
    '<div class="image-export-preview-empty">Rendering preview...</div>';
  const settings = TPP.settings();
  stage.style.setProperty(
    "--image-export-preview-ratio",
    settings.page.w + " / " + settings.page.h,
  );
  const exportOptions = TPP.imageExportOptions({
    dpi: Number(dpi.value) || 300,
    format: format.value || "png",
    quality: Number(quality.value) || 92,
    colorDepth: colorDepth.value || "color24",
    palette: palette.value || "websafe",
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
    const beforeBlob = await TPP.exportBlobForCanvas(baseCanvas, {
      format: "png",
      quality: 100,
    });
    const afterCanvas = TPP.exportCanvasForDepth(
      baseCanvas,
      exportOptions.colorDepth,
      exportOptions.threshold,
      exportOptions.palette,
    );
    const afterBlob = await TPP.exportBlobForCanvas(afterCanvas, exportOptions);
    if (TPP.imageExportPreviewToken !== token) return;
    const beforeSrc = beforeBlob ? URL.createObjectURL(beforeBlob) : "";
    const afterSrc = afterBlob ? URL.createObjectURL(afterBlob) : "";
    const baseName = (
      (settings.title || "tiny-book") +
      "-page-" +
      (TPP.imageExportPreviewIndex + 1)
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    stage.innerHTML =
      '<div class="image-export-compare">' +
      '<img draggable="false" src="' +
      TPP.esc(beforeSrc) +
      '" alt="Original preview">' +
      '<img draggable="false" class="image-export-compare-after" src="' +
      TPP.esc(afterSrc) +
      '" alt="Exported preview">' +
      '<div class="image-export-compare-divider"></div>' +
      '<div class="image-export-compare-label before">Before<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel
          ? TPP.fileBytesLabel(beforeBlob ? beforeBlob.size : 0)
          : String(beforeBlob ? beforeBlob.size : 0),
      ) +
      "</span></div>" +
      '<div class="image-export-compare-label after">After<span class="image-export-compare-size">' +
      TPP.esc(
        TPP.fileBytesLabel
          ? TPP.fileBytesLabel(afterBlob ? afterBlob.size : 0)
          : String(afterBlob ? afterBlob.size : 0),
      ) +
      "</span></div>" +
      "</div>";
    TPP.setImageExportPreviewDownloads({
      before: {
        src: beforeSrc,
        blob: beforeBlob,
        name: baseName + "-before.png",
      },
      after: {
        src: afterSrc,
        blob: afterBlob,
        name:
          baseName +
          "-after." +
          (exportOptions.format === "jpeg" ? "jpg" : exportOptions.format),
      },
    });
    TPP.bindImageExportPreviewDrag();
  } catch (_error) {
    if (TPP.imageExportPreviewToken !== token) return;
    TPP.setImageExportPreviewDownloads(null);
    stage.innerHTML =
      '<div class="image-export-preview-empty">Unable to render preview</div>';
    console.error("Image export preview failed", _error);
    if (exportOptions.format === "gif")
      TPP.toast(
        "GIF preview failed: " +
          (_error && _error.message ? _error.message : "Unknown GIF error"),
      );
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
TPP.enforceSingleOpenSettingsSection = function (activeDetails) {
  if (!activeDetails || !activeDetails.open) return;
  TPP.settingsDetails().forEach(function (details) {
    if (details !== activeDetails) details.open = false;
  });
};
TPP.setBookButtonTextVisibility = function (showText) {
  const show = showText !== false;
  document.body.classList.toggle("book-icons-only", !show);
  const toggle = document.getElementById("toggleBookButtonText");
  if (!toggle) return;
  const label = toggle.querySelector(".book-toolbar-label");
  if (label) label.textContent = show ? "Hide Labels" : "Show Labels";
  toggle.setAttribute("aria-pressed", show ? "false" : "true");
};
TPP.restoreSettingsUi = function () {
  const state = TPP.readSettingsUi();
  let lastOpen = null;
  TPP.settingsDetails().forEach(function (details, index) {
    details.dataset.settingsIndex = index;
    if (state.open && Object.prototype.hasOwnProperty.call(state.open, index)) {
      details.open = Boolean(state.open[index]);
      if (details.open) lastOpen = details;
    }
  });
  if (lastOpen) TPP.enforceSingleOpenSettingsSection(lastOpen);
  const controls = document.querySelector(".controls");
  if (controls && Number.isFinite(Number(state.scrollTop))) {
    requestAnimationFrame(function () {
      controls.scrollTop = Number(state.scrollTop) || 0;
    });
  }
  TPP.setBookButtonTextVisibility(state.showBookButtonText !== false);
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
    showBookButtonText: state.showBookButtonText !== false,
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
    details.addEventListener("toggle", function () {
      if (details.open) TPP.enforceSingleOpenSettingsSection(details);
      TPP.saveSettingsUi();
    });
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
  const body = document.body;
  const appShell = document.querySelector(".app-shell");
  const controls = document.querySelector(".controls");
  const settings = document.querySelector(".settings");
  const dataSidebar = document.getElementById("dataSidebar");
  const bookChromeBar = document.getElementById("bookChromeBar");
  const bookActionsBar = document.getElementById("bookActionsBar");
  const bookTabsBar = document.getElementById("bookTabsBar");
  const dataMode = TPP.view === "data";
  const softwareMode = TPP.view === "software";
  const libraryMode = TPP.view === "library";
  const hideBookChrome = softwareMode || libraryMode;
  if (body) body.classList.toggle("book-chrome-hidden", hideBookChrome);
  if (appShell) appShell.classList.toggle("no-sidebar", hideBookChrome);
  if (settings) settings.hidden = hideBookChrome;
  if (controls) controls.hidden = dataMode || softwareMode || libraryMode;
  if (dataSidebar) dataSidebar.hidden = !dataMode;
  if (bookChromeBar) bookChromeBar.hidden = hideBookChrome;
  if (bookTabsBar) bookTabsBar.hidden = hideBookChrome;
  if (bookActionsBar) bookActionsBar.hidden = hideBookChrome;
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
    if (TPP.renderTextElementControls) TPP.renderTextElementControls();
    TPP.renderChapterList();
    TPP.renderChapterEditor();
  }
  if (TPP.view === "about") TPP.renderAbout();
  if (TPP.view === "software") TPP.renderSoftwareAbout();
  if (TPP.view === "data") TPP.renderData();
  if (TPP.view === "interior") TPP.renderInterior();
  if (TPP.view === "cover") TPP.renderCover();
  if (TPP.view === "reader") TPP.renderReader();
  if (TPP.view === "library") TPP.renderLibrary();
  if (TPP.renderColorPalettes) TPP.renderColorPalettes();
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
