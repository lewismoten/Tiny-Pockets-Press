window.TPP = window.TPP || {};

TPP.patchCoverPreviewSurface = function (location) {
  const side = location === "back" ? "back" : "front";
  const preview = document.getElementById("coverPreview");
  if (!preview || !TPP.active || TPP.view !== "cover") return false;
  if (location === "spine") {
    const settings = TPP.settings();
    const spineW = TPP.spineWidth(settings);
    if (!(spineW > 0) || !TPP.spineEl) return false;
    const spineNodes = Array.from(preview.querySelectorAll(".spine-piece"));
    if (!spineNodes.length) return false;
    spineNodes.forEach(function (node) {
      node.replaceWith(
        TPP.spineEl(
          settings,
          TPP.coverWrap(settings) + settings.page.w + spineW / 2,
          TPP.coverWrap(settings),
          settings.page.h,
        ),
      );
    });
    return true;
  }
  const selector = side === "back" ? ".page.back" : ".page.cover";
  const pageNodes = Array.from(preview.querySelectorAll(selector));
  if (!pageNodes.length || !TPP.coverHTML) return false;
  pageNodes.forEach(function (pageNode) {
    const inner = pageNode.querySelector(".page-inner");
    if (inner) inner.innerHTML = TPP.coverHTML(TPP.active, side);
  });
  return pageNodes.some(function (pageNode) {
    return !!pageNode.querySelector(".page-inner");
  });
};

TPP.patchReaderPreviewSurface = function (location) {
  const role = location === "back" ? "back" : "front";
  const preview = document.getElementById("readerPreview");
  if (
    !preview ||
    !TPP.active ||
    TPP.view !== "reader" ||
    !Array.isArray(TPP.readerVisiblePageRoles) ||
    !TPP.readerVisiblePageRoles.includes(location === "spine" ? "front" : role)
  ) {
    return false;
  }
  if (location === "spine") {
    const settings = TPP.settings();
    const spineW = TPP.spineWidth(settings);
    if (!(spineW > 0) || !TPP.spineEl) return false;
    const spineNodes = Array.from(preview.querySelectorAll(".spine-piece"));
    if (!spineNodes.length) return false;
    spineNodes.forEach(function (node) {
      node.replaceWith(TPP.spineEl(settings, spineW / 2, 0, settings.page.h));
    });
    return true;
  }
  if (!TPP.coverHTML) return false;
  const selector =
    role === "back"
      ? '.page[data-page-role="back"]'
      : '.page[data-page-role="front"]';
  const pageNodes = Array.from(preview.querySelectorAll(selector));
  if (!pageNodes.length) return false;
  pageNodes.forEach(function (pageNode) {
    const inner = pageNode.querySelector(".page-inner");
    if (inner) inner.innerHTML = TPP.coverHTML(TPP.active, location);
  });
  return true;
};

TPP.patchVisibleCoverTextPreview = function (location) {
  if (location !== "front" && location !== "back" && location !== "spine") {
    return false;
  }
  if (TPP.view === "cover") return TPP.patchCoverPreviewSurface(location);
  if (TPP.view === "reader") return TPP.patchReaderPreviewSurface(location);
  return false;
};
