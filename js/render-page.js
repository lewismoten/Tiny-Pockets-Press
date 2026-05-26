window.TPP = window.TPP || {};

TPP.stroke = function (enabled, size, color) {
  if (!enabled || Number(size) <= 0) return "0 2px 10px rgb(0 0 0 / .35)";
  return size + "px 0 " + color + ",-" + size + "px 0 " + color + ",0 " + size + "px " + color + ",0 -" + size + "px " + color + ",0 2px 10px rgb(0 0 0 / .35)";
};
TPP.coverHTML = function (settings, side) {
  const image = side === "front" ? settings.coverImageData : (settings.backUseFrontImage ? settings.coverImageData : settings.backImageData);
  if (side === "back") {
    const align = ["left", "center", "justify"].includes(settings.backTextAlign) ? settings.backTextAlign : "center";
    const last = ["auto", "center", "justify"].includes(settings.backTextLastLine) ? settings.backTextLastLine : "auto";
    return (image ? '<img class="back-img" src="' + image + '" style="width:' + settings.backImgZoom + '%;margin-left:' + settings.backImgX + '%;margin-top:' + settings.backImgY + '%">' : "") +
      '<div class="back-text align-' + align + ' last-' + last + '"><div class="story-text">' + TPP.safeMarkdown(settings.backText || "") + "</div></div>";
  }
  const series = [settings.seriesName, settings.number].filter(Boolean).join(" ");
  return (image ? '<img class="cover-img" src="' + image + '" style="width:' + settings.coverImgZoom + '%;margin-left:' + settings.coverImgX + '%;margin-top:' + settings.coverImgY + '%">' : "") +
    '<div class="cover-el cover-title">' + TPP.esc(settings.title) + "</div>" +
    (settings.coverShowAuthor ? '<div class="cover-el cover-author">' + TPP.esc(settings.author) + "</div>" : "") +
    (settings.coverShowSeries ? '<div class="cover-el cover-series">' + TPP.esc(series) + "</div>" : "") +
    (settings.coverShowPublisher ? '<div class="cover-el cover-publisher">' + TPP.esc(settings.publisher) + "</div>" : "");
};
TPP.applyVars = function (element, settings) {
  element.style.setProperty("--page-bg", settings.pageBg);
  element.style.setProperty("--page-text", settings.pageText);
  element.style.setProperty("--page-outline", settings.showPageGuides ? ".5px solid #d8d0c3" : "0");
  element.style.setProperty("--font", settings.fontFamily);
  element.style.setProperty("--body-size", settings.bodySize + "pt");
  element.style.setProperty("--caption-size", settings.captionSize + "pt");
  element.style.setProperty("--line-height", settings.lineHeight);
  element.style.setProperty("--para-gap", settings.paraGap + "em");
  element.style.setProperty("--align", settings.justify ? "justify" : "left");
  element.style.setProperty("--margin", settings.margin + "in");
  element.style.setProperty("--gutter-margin", Math.max(0, Number(settings.gutterMargin) || 0) + "in");
  element.style.setProperty("--cover-bg1", settings.coverBg1);
  element.style.setProperty("--cover-bg2", settings.coverBg2);
  element.style.setProperty("--cover-text", settings.coverText);
  element.style.setProperty("--cover-border", settings.coverBorder);
  element.style.setProperty("--cover-title-size", settings.coverTitleSize + "pt");
  element.style.setProperty("--cover-meta-size", settings.coverMetaSize + "pt");
  element.style.setProperty("--cover-stroke", TPP.stroke(settings.coverStroke, settings.coverStrokeSize, settings.coverStrokeColor));
  element.style.setProperty("--title-y", settings.coverTitleY + "%");
  element.style.setProperty("--author-y", settings.coverAuthorY + "%");
  element.style.setProperty("--series-y", settings.coverSeriesY + "%");
  element.style.setProperty("--publisher-y", settings.coverPublisherY + "%");
  element.style.setProperty("--back-y", settings.backTextY + "%");
  element.style.setProperty("--back-size", settings.backTextSize + "pt");
  element.style.setProperty("--back-color", settings.backTextColor);
  element.style.setProperty("--chapter-title-size", Math.max(3, settings.bodySize * 1.2) + "pt");
  element.style.setProperty("--chapter-title-color", settings.pageText);
  element.style.setProperty("--toc-leader-color", settings.tocLeaderColor);
  element.style.setProperty("--page-number-size", Math.max(3, settings.bodySize * 0.75) + "pt");
  element.style.setProperty("--page-number-color", settings.pageText);
  element.style.setProperty("--spine-title-size", settings.spineTitleSize + "pt");
  element.style.setProperty("--spine-title-x", (Number(settings.spineTitleX) || 0) + "%");
  element.style.setProperty("--spine-title-y", (Number(settings.spineTitleY) || 0) + "%");
  element.style.setProperty("--spine-author-size", settings.spineAuthorSize + "pt");
  element.style.setProperty("--spine-text-color", settings.spineTextColor);
  element.style.setProperty("--spine-stroke", TPP.stroke(settings.spineStroke, settings.spineStrokeSize, settings.spineStrokeColor));
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
    page.type === "cover" || page.type === "back" ? "" : "texture-" + settings.texture,
    (page.type === "cover" && settings.coverBorderOn) || (page.type === "back" && settings.backFrameOn) ? "frame" : ""
  ].filter(Boolean).join(" ");
  element.style.left = staticMode ? "0" : x + "in";
  element.style.top = staticMode ? "0" : y + "in";
  element.style.width = width + "in";
  element.style.height = height + "in";
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

  if (settings.pageNumMode !== "none" && !["cover", "back", "inside", "blank"].includes(page.type)) {
    const num = document.createElement("div");
    let left = settings.pageNumLeft || "";
    let right = settings.pageNumRight || "";
    if (settings.pageOrnament === "dash") { left = "— "; right = " —"; }
    if (settings.pageOrnament === "floral") { left = "☙ "; right = " ❧"; }
    if (settings.pageOrnament === "heart") { left = "♥ "; right = " ♥"; }
    if (settings.ornamentBySide && settings.pageNumMode === "edge") {
      let useLeft = page.n % 2 === 0;
      if (settings.reverseOrnamentsBySide) useLeft = !useLeft;
      if (useLeft) right = "";
      else left = "";
    }
    num.className = "page-number " + (settings.pageNumMode === "edge" ? "edge" : "");
    num.textContent = left + page.n + right;
    element.appendChild(num);
  }
  setTimeout(function () { TPP.renderQr(element, settings); }, 0);
  return element;
};
TPP.spineWidth = function (settings) {
  if (settings.spineMode === "none") return 0;
  return Math.max(0.04, (TPP.lastPages.length || 16) * (Number(settings.paperThickness) || 0.004) + (Number(settings.bindingAllowance) || 0) + (Number(settings.boardThickness) || 0));
};
TPP.spineEl = function (settings, x, y, height) {
  const width = TPP.spineWidth(settings);
  const element = document.createElement("div");
  element.className = "cover-piece spine-piece";
  element.style.left = (x - width / 2) + "in";
  element.style.top = y + "in";
  element.style.width = width + "in";
  element.style.height = height + "in";
  TPP.applyVars(element, settings);
  const hasAuthor = settings.spineAuthorOn && String(settings.spineAuthor || settings.author || "").trim();
  const authorReserve = hasAuthor ? Math.max(0.12, ((Number(settings.spineAuthorSize) || 4) / 72) * 1.6) : 0;
  element.style.setProperty("--spine-title-length", Math.max(0.1, height - authorReserve) + "in");
  element.innerHTML =
    (settings.spineImageData ? '<img class="spine-img" src="' + settings.spineImageData + '" style="width:' + settings.spineImgZoom + '%;margin-left:' + settings.spineImgX + '%">' : "") +
    '<div class="spine-title ' + (settings.spineTitleRotate ? "rot" : "") + '">' + TPP.esc(settings.title) + "</div>" +
    (hasAuthor ? '<div class="spine-author ' + (settings.spineAuthorRotate ? "rot" : "") + '">' + TPP.esc(settings.spineAuthor || settings.author) + "</div>" : "");
  return element;
};
