window.TPP = window.TPP || {};

TPP.stroke = function (enabled, size, color) {
  if (!enabled || Number(size) <= 0) return "0 2px 10px rgb(0 0 0 / .35)";
  return (
    size +
    "px 0 " +
    color +
    ",-" +
    size +
    "px 0 " +
    color +
    ",0 " +
    size +
    "px " +
    color +
    ",0 -" +
    size +
    "px " +
    color +
    ",0 2px 10px rgb(0 0 0 / .35)"
  );
};
TPP.strokeWidth = function (size) {
  return Number(size) > 0 ? Number(size) + "px" : "0px";
};
TPP.finiteNumberOr =
  TPP.finiteNumberOr ||
  function (value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };
TPP.textRotationDegrees =
  TPP.textRotationDegrees ||
  function (value) {
    if (value === true) return 90;
    if (value === false || value == null || value === "") return 0;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };
TPP.textBoxStyle = function (element, options) {
  const entry = element || {};
  const centerX = Number(options && options.centerX);
  const x = TPP.finiteNumberOr(entry.x, centerX);
  const y = TPP.finiteNumberOr(entry.y, 0);
  const width = Math.max(
    10,
    Math.min(100, TPP.finiteNumberOr(entry.width, 100)),
  );
  const align = ["left", "center", "right", "justify"].includes(entry.align)
    ? entry.align
    : "center";
  const clip = entry.align === "clip";
  const rotateDegrees = TPP.textRotationDegrees(entry.rotate);
  const rotate = rotateDegrees ? " rotate(" + rotateDegrees + "deg)" : "";
  return [
    "left:" + (Number.isFinite(x) ? x : 50) + "%",
    "top:" + y + "%",
    "width:" + width + "%",
    "transform:translateX(-50%)" + rotate,
    "text-align:" + (clip ? "left" : align),
    "text-align-last:" + (clip ? "left" : align),
    "color:" + (entry.color || "#ffffff"),
    "font-size:" + (Number(entry.size) || 4) + "pt",
    "-webkit-text-stroke-width:" + TPP.strokeWidth(entry.outlineSize),
    "-webkit-text-stroke-color:" + (entry.outlineColor || "#000000"),
    "white-space:" + (clip ? "nowrap" : "normal"),
    "overflow:" + (clip ? "hidden" : "visible"),
    "text-overflow:" + (clip ? "clip" : "initial"),
  ].join(";");
};
TPP.spineTextStyle = function (element, titleLengthIn) {
  const entry = element || {};
  const x = TPP.finiteNumberOr(entry.x, 50);
  const y = TPP.finiteNumberOr(entry.y, 0);
  const width = Math.max(
    10,
    Math.min(100, TPP.finiteNumberOr(entry.width, 100)),
  );
  const align = ["left", "center", "right", "justify"].includes(entry.align)
    ? entry.align
    : "left";
  const clip = entry.align === "clip";
  const rotateDegrees = TPP.textRotationDegrees(entry.rotate);
  const widthCss = entry.rotate
    ? "calc(" +
      Math.max(0.1, Number(titleLengthIn) || 0.1) +
      "in * " +
      width / 100 +
      ")"
    : width + "%";
  return [
    "left:" + x + "%",
    "top:" + y + "%",
    "width:" + widthCss,
    "transform:translateX(-50%)" +
      (rotateDegrees ? " rotate(" + rotateDegrees + "deg)" : ""),
    "text-align:" + (clip ? "left" : align),
    "text-align-last:" + (clip ? "left" : align),
    "color:" + (entry.color || "#ffffff"),
    "font-size:" + (Number(entry.size) || 4) + "pt",
    "-webkit-text-stroke-width:" + TPP.strokeWidth(entry.outlineSize),
    "-webkit-text-stroke-color:" + (entry.outlineColor || "#000000"),
    "white-space:" + (clip ? "nowrap" : "normal"),
    "overflow:" + (clip ? "hidden" : "visible"),
    "text-overflow:" + (clip ? "clip" : "initial"),
  ].join(";");
};
TPP.coverTextBox = function (settings, part, className) {
  const element = TPP.findTextElement(settings, "front", part);
  const text = TPP.textElementContent(settings, "front", part);
  if (!element || element.enabled === false || !String(text || "").trim())
    return "";
  return (
    '<div class="cover-el ' +
    className +
    '" style="' +
    TPP.textBoxStyle(element, { centerX: 50 }) +
    '">' +
    TPP.esc(text) +
    "</div>"
  );
};
TPP.coverTextBoxesHtml = function (settings, location, classPrefix, options) {
  const centerX = Number((options && options.centerX) ?? 50);
  return TPP.textElementsForLocation(settings, location)
    .map(function (element, index) {
      const text = TPP.bookInfoFieldValue(
        settings,
        element.fieldKey || element.part,
        {
          location: location,
          customText: element.customText,
        },
      );
      if (element.enabled === false || !String(text || "").trim()) return "";
      return (
        '<div class="' +
        TPP.esc(classPrefix || "cover-el") +
        " " +
        TPP.esc((classPrefix || "cover-el") + "-" + index) +
        '" style="' +
        TPP.textBoxStyle(element, { centerX: centerX }) +
        '">' +
        TPP.esc(text) +
        "</div>"
      );
    })
    .join("");
};
TPP.imageElementStyle = function (element, fallbackZoom) {
  const entry = element || {};
  return (
    "width:" +
    (Number(entry.zoom) || fallbackZoom || 100) +
    "%;" +
    "margin-left:" +
    (Number(entry.x) || 0) +
    "%;" +
    "margin-top:" +
    (Number(entry.y) || 0) +
    "%;" +
    "transform:translate(-50%,-50%) rotate(" +
    (Number(entry.rotate) || 0) +
    "deg)"
  );
};
TPP.coverImageSrc = function (settings, side) {
  const element = TPP.findImageElement(
    settings,
    side === "front" ? "front" : "back",
    "cover",
  );
  return TPP.fileData(settings, element && element.fileId);
};
TPP.coverHTML = function (settings, side) {
  const image = TPP.coverImageSrc(settings, side);
  if (side === "back") {
    const imageElement = TPP.findImageElement(settings, "back", "cover");
    return (
      (image
        ? '<img class="back-img" src="' +
          image +
          '" style="' +
          TPP.imageElementStyle(imageElement, 120) +
          '">'
        : "") +
      TPP.coverTextBoxesHtml(settings, "back", "cover-el", { centerX: 50 })
    );
  }
  const imageElement = TPP.findImageElement(settings, "front", "cover");
  return (
    (image
      ? '<img class="cover-img" src="' +
        image +
        '" style="' +
        TPP.imageElementStyle(imageElement, 120) +
        '">'
      : "") +
    TPP.coverTextBoxesHtml(settings, "front", "cover-el", { centerX: 50 })
  );
};
TPP.applyVars = function (element, settings) {
  element.style.setProperty("--page-bg", settings.pageBg);
  element.style.setProperty("--page-text", settings.pageText);
  element.style.setProperty(
    "--page-outline",
    settings.showPageGuides ? ".5px solid #d8d0c3" : "0",
  );
  element.style.setProperty("--font", settings.fontFamily);
  element.style.setProperty("--body-size", settings.bodySize + "pt");
  element.style.setProperty("--caption-size", settings.captionSize + "pt");
  element.style.setProperty(
    "--media-caption-size",
    settings.mediaCaptionSize + "pt",
  );
  element.style.setProperty("--line-height", settings.lineHeight);
  element.style.setProperty("--para-gap", settings.paraGap + "em");
  element.style.setProperty("--align", settings.justify ? "justify" : "left");
  element.style.setProperty("--margin", settings.margin + "in");
  element.style.setProperty(
    "--gutter-margin",
    Math.max(0, Number(settings.gutterMargin) || 0) + "in",
  );
  element.style.setProperty("--cover-bg1", settings.coverBg1);
  element.style.setProperty("--cover-bg2", settings.coverBg2);
  element.style.setProperty("--cover-text", settings.coverText);
  element.style.setProperty("--cover-border", settings.coverBorder);
  element.style.setProperty("--back-y", settings.backTextY + "%");
  element.style.setProperty("--back-size", settings.backTextSize + "pt");
  element.style.setProperty("--back-color", settings.backTextColor);
  element.style.setProperty(
    "--chapter-title-size",
    Math.max(3, settings.bodySize * 1.2) + "pt",
  );
  element.style.setProperty("--chapter-title-color", settings.pageText);
  element.style.setProperty("--toc-leader-color", settings.tocLeaderColor);
  element.style.setProperty(
    "--page-number-size",
    Math.max(3, settings.bodySize * 0.75) + "pt",
  );
  element.style.setProperty("--page-number-color", settings.pageText);
  element.style.setProperty(
    "--spine-title-size",
    settings.spineTitleSize + "pt",
  );
  element.style.setProperty(
    "--spine-title-x",
    (Number(settings.spineTitleX) || 0) + "%",
  );
  element.style.setProperty(
    "--spine-title-y",
    (Number(settings.spineTitleY) || 0) + "%",
  );
  element.style.setProperty(
    "--spine-author-size",
    settings.spineAuthorSize + "pt",
  );
  element.style.setProperty("--spine-text-color", settings.spineTextColor);
  element.style.setProperty(
    "--spine-stroke-width",
    TPP.strokeWidth(settings.spineStrokeSize),
  );
  element.style.setProperty("--spine-stroke-color", settings.spineStrokeColor);
};
TPP.pageEl = function (page, settings, x, y, rotate, staticMode, size) {
  const width = (size && size.w) || settings.page.w;
  const height = (size && size.h) || settings.page.h;
  const element = document.createElement("div");
  element.className = [
    "page",
    page.type,
    page.n % 2 === 0 ? "even" : "odd",
    page.type === "cover" && settings.coverOverflowImage ? "bleed" : "",
    page.type === "cover" && settings.coverClipImageToFrame ? "clip-img" : "",
    page.type === "back" && !settings.backClipImageToFrame ? "bleed" : "",
    page.type === "back" && settings.backClipImageToFrame ? "clip-img" : "",
    page.type === "cover" || page.type === "back"
      ? ""
      : "texture-" + settings.texture,
    (page.type === "cover" && settings.coverBorderOn) ||
    (page.type === "back" && settings.backFrameOn)
      ? "frame"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  element.style.left = staticMode ? "0" : x + "in";
  element.style.top = staticMode ? "0" : y + "in";
  element.style.width = width + "in";
  element.style.height = height + "in";
  element.dataset.pageType = String(page.type || "");
  if (page.role) element.dataset.pageRole = String(page.role);
  TPP.applyVars(element, settings);
  if (rotate && !staticMode) {
    element.style.transformOrigin = "top left";
    element.style.transform = "translate(" + height + "in,0) rotate(90deg)";
  }
  const inner = document.createElement("div");
  inner.className = "page-inner";
  inner.innerHTML = page.html;
  if (page.type === "blank") inner.classList.add("blank");
  element.appendChild(inner);

  if (
    settings.pageNumMode !== "none" &&
    !["cover", "back", "inside", "blank"].includes(page.type)
  ) {
    const num = document.createElement("div");
    let left = settings.pageNumLeft || "";
    let right = settings.pageNumRight || "";
    if (settings.pageOrnament === "dash") {
      left = "— ";
      right = " —";
    }
    if (settings.pageOrnament === "floral") {
      left = "☙ ";
      right = " ❧";
    }
    if (settings.pageOrnament === "heart") {
      left = "♥ ";
      right = " ♥";
    }
    if (settings.ornamentBySide && settings.pageNumMode === "edge") {
      let useLeft = page.n % 2 === 0;
      if (settings.reverseOrnamentsBySide) useLeft = !useLeft;
      if (useLeft) right = "";
      else left = "";
    }
    num.className =
      "page-number " + (settings.pageNumMode === "edge" ? "edge" : "");
    num.textContent = left + page.n + right;
    element.appendChild(num);
  }
  setTimeout(function () {
    TPP.renderQr(element, settings);
  }, 0);
  return element;
};
TPP.spineWidth = function (settings) {
  if (settings.spineMode === "none") return 0;
  return Math.max(
    0.04,
    (TPP.lastPages.length || 16) * (Number(settings.paperThickness) || 0.004) +
      (Number(settings.bindingAllowance) || 0) +
      (Number(settings.boardThickness) || 0),
  );
};
TPP.spineEl = function (settings, x, y, height) {
  const width = TPP.spineWidth(settings);
  const element = document.createElement("div");
  element.className = "cover-piece spine-piece";
  element.style.left = x - width / 2 + "in";
  element.style.top = y + "in";
  element.style.width = width + "in";
  element.style.height = height + "in";
  TPP.applyVars(element, settings);
  const spineTexts = TPP.textElementsForLocation(settings, "spine");
  const spineImage = TPP.findImageElement(settings, "spine", "cover");
  element.innerHTML =
    (spineImage && spineImage.fileId
      ? '<img class="spine-img" src="' +
        TPP.fileData(settings, spineImage.fileId) +
        '" style="' +
        TPP.imageElementStyle(spineImage, 100) +
        '">'
      : "") +
    spineTexts
      .map(function (entry, index) {
        const text = TPP.bookInfoFieldValue(
          settings,
          entry.fieldKey || entry.part,
          {
            location: "spine",
            customText: entry.customText,
          },
        );
        if (entry.enabled === false || !String(text || "").trim()) return "";
        return (
          '<div class="spine-text spine-text-' +
          index +
          (TPP.textRotationDegrees(entry.rotate) ? " rot" : "") +
          '" style="' +
          TPP.spineTextStyle(entry, Math.max(0.1, height)) +
          '">' +
          TPP.esc(text) +
          "</div>"
        );
      })
      .join("");
  return element;
};
