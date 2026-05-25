window.TPP = window.TPP || {};

TPP.bestGrid = function (sheet, unit) {
  const options = [
    { rot: false, w: unit.w, h: unit.h },
    { rot: true, w: unit.h, h: unit.w }
  ];
  let best = null;
  options.forEach(function (option) {
    const cols = Math.max(1, Math.floor(sheet.w / option.w));
    const rows = Math.max(1, Math.floor(sheet.h / option.h));
    const count = cols * rows;
    if (!best || count > best.count) best = Object.assign({}, option, { cols, rows, count });
  });
  return best;
};
TPP.pairs = function (count) {
  const padded = Math.ceil(count / 4) * 4;
  const out = [];
  for (let i = 0; i < padded / 4; i++) {
    out.push({ side: "front", pages: [padded - i * 2, 1 + i * 2] });
    out.push({ side: "back", pages: [2 + i * 2, padded - 1 - i * 2] });
  }
  return out;
};
TPP.guide = function (sheet, cls, x, y, w, h) {
  const guide = document.createElement("div");
  guide.className = cls;
  guide.style.left = x + "in";
  guide.style.top = y + "in";
  guide.style.width = w + "in";
  guide.style.height = h + "in";
  sheet.appendChild(guide);
};
TPP.coverCutColor = function (settings) {
  if (!TPP.contrastRatio) return "#000000";
  const black = Math.min(TPP.contrastRatio(settings.coverBg1, "#000000"), TPP.contrastRatio(settings.coverBg2, "#000000"));
  const white = Math.min(TPP.contrastRatio(settings.coverBg1, "#ffffff"), TPP.contrastRatio(settings.coverBg2, "#ffffff"));
  return black >= white ? "#000000" : "#ffffff";
};
TPP.svgPath = function (svg, d, color, width) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", width || "0.018");
  path.setAttribute("stroke-linecap", "square");
  path.setAttribute("stroke-linejoin", "miter");
  path.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(path);
};
TPP.coverCutGeometry = function (settings) {
  const wrap = Math.max(0, Number(settings.wrapInside) || 0);
  const board = Math.max(0, Number(settings.boardThickness) || 0);
  const inset = settings.wrapCover ? wrap : 0;
  const thickness = inset ? Math.min(inset * 0.8, Math.max(0.025, board || inset * 0.3)) : 0;
  return { inset: inset, thickness: thickness };
};
TPP.coverCutOutlinePath = function (settings, w, h) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  const t = geo.thickness;
  if (!inset || !t) return "M0 0H" + w + "V" + h + "H0Z";
  return [
    "M", inset + t, 0,
    "H", w - inset - t,
    "L", w - inset, t,
    "V", inset,
    "H", w - t,
    "L", w, inset + t,
    "V", h - inset - t,
    "L", w - t, h - inset,
    "H", w - inset,
    "V", h - t,
    "L", w - inset - t, h,
    "H", inset + t,
    "L", inset, h - t,
    "V", h - inset,
    "H", t,
    "L", 0, h - inset - t,
    "V", inset + t,
    "L", t, inset,
    "H", inset,
    "V", t,
    "Z"
  ].join(" ");
};
TPP.coverCutClipPath = function (settings, w, h) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  const t = geo.thickness;
  if (!inset || !t) return "";
  const pct = function (value, total) { return (value / total * 100).toFixed(4) + "%"; };
  return "polygon(" + [
    pct(inset + t, w) + " 0",
    pct(w - inset - t, w) + " 0",
    pct(w - inset, w) + " " + pct(t, h),
    pct(w - inset, w) + " " + pct(inset, h),
    pct(w - t, w) + " " + pct(inset, h),
    "100% " + pct(inset + t, h),
    "100% " + pct(h - inset - t, h),
    pct(w - t, w) + " " + pct(h - inset, h),
    pct(w - inset, w) + " " + pct(h - inset, h),
    pct(w - inset, w) + " " + pct(h - t, h),
    pct(w - inset - t, w) + " 100%",
    pct(inset + t, w) + " 100%",
    pct(inset, w) + " " + pct(h - t, h),
    pct(inset, w) + " " + pct(h - inset, h),
    pct(t, w) + " " + pct(h - inset, h),
    "0 " + pct(h - inset - t, h),
    "0 " + pct(inset + t, h),
    pct(t, w) + " " + pct(inset, h),
    pct(inset, w) + " " + pct(inset, h),
    pct(inset, w) + " " + pct(t, h)
  ].join(", ") + ")";
};
TPP.coverCutPaths = function (settings, w, h, spineW) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  if (inset <= 0) return [];
  const pageW = settings.page.w;
  const foldA = inset + pageW;
  const foldB = inset + pageW + spineW;
  return [
    "M" + foldA + " 0V" + inset + " M" + foldA + " " + h + "V" + (h - inset),
    "M" + foldB + " 0V" + inset + " M" + foldB + " " + h + "V" + (h - inset)
  ];
};
TPP.coverPerimeter = function (sheet, settings, x, y, w, h, spineW) {
  if (!settings.coverPerimeterOn) return;
  const outline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const color = TPP.coverCutColor(settings);
  outline.className = "cover-perimeter";
  outline.style.left = x + "in";
  outline.style.top = y + "in";
  outline.style.width = w + "in";
  outline.style.height = h + "in";
  outline.setAttribute("viewBox", "0 0 " + w + " " + h);
  const outlinePath = TPP.coverCutOutlinePath(settings, w, h);
  const backing = color === "#000000" ? "#ffffff" : "#000000";
  TPP.svgPath(outline, outlinePath, backing, "0.04");
  TPP.svgPath(outline, outlinePath, color, "0.018");
  TPP.coverCutPaths(settings, w, h, spineW).forEach(function (d) {
    TPP.svgPath(outline, d, backing, "0.045");
    TPP.svgPath(outline, d, color, "0.022");
  });
  sheet.appendChild(outline);
};
TPP.coverFootprint = function (sheet, settings, x, y, w, h) {
  const footprint = document.createElement("div");
  footprint.className = "cover-footprint";
  footprint.style.left = x + "in";
  footprint.style.top = y + "in";
  footprint.style.width = w + "in";
  footprint.style.height = h + "in";
  TPP.applyVars(footprint, settings);
  const clipPath = TPP.coverCutClipPath(settings, w, h);
  if (clipPath) footprint.style.clipPath = clipPath;
  sheet.appendChild(footprint);
};
TPP.guides = function (sheet, settings, x, y, w, h, spineW) {
  if (settings.showCutGuides) {
    const len = Math.min(0.12, w / 8, h / 8);
    [x, x + w].forEach(function (xx) {
      TPP.guide(sheet, "cut", xx - 0.004, y - len, 0.008, len);
      TPP.guide(sheet, "cut", xx - 0.004, y + h, 0.008, len);
    });
    [y, y + h].forEach(function (yy) {
      TPP.guide(sheet, "cut", x - len, yy - 0.004, len, 0.008);
      TPP.guide(sheet, "cut", x + w, yy - 0.004, len, 0.008);
    });
  }
  if (settings.showFoldGuides) {
    if (spineW) {
      const wrap = settings.wrapCover ? Math.max(0, Number(settings.wrapInside) || 0) : 0;
      TPP.guide(sheet, "fold v", x + wrap + settings.page.w, y, 0, h);
      TPP.guide(sheet, "fold v", x + wrap + settings.page.w + spineW, y, 0, h);
    } else {
      TPP.guide(sheet, "fold v", x + w / 2, y, 0, h);
    }
  }
};
TPP.makeSheet = function (settings, title) {
  const scale = Math.min(1, 900 / (settings.sheet.w * 96));
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.dataset.pdfPage = "1";
  sheet.style.width = settings.sheet.w + "in";
  sheet.style.height = settings.sheet.h + "in";
  sheet.style.transform = "scale(" + scale + ")";
  sheet.style.transformOrigin = "top center";
  sheet.style.marginBottom = ((scale - 1) * settings.sheet.h) + "in";
  const label = document.createElement("div");
  label.className = "sheet-title";
  label.textContent = title;
  sheet.appendChild(label);
  return sheet;
};
TPP.renderInterior = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const preview = document.getElementById("interiorPreview");
  preview.innerHTML = "";
  const pairs = TPP.pairs(pages.length).filter(function (pair) {
    return !pair.pages.some(function (n) { return pages[n - 1] && pages[n - 1].cover; });
  });
  const unit = { w: settings.page.w * 2, h: settings.page.h };
  const grid = TPP.bestGrid(settings.sheet, unit);
  const per = grid.count;
  const sides = Math.ceil(pairs.length / per);
  document.getElementById("interiorSummary").innerHTML =
    "<strong>" + pages.length + " book pages</strong>. Interior booklet imposition has " + pairs.length +
    " front/back side blocks. " + per + " blocks fit per sheet side. " +
    (settings.duplexBackSides ? "Duplex blank/opposite sheets are included." : "");
  for (let side = 0; side < sides; side++) {
    const sheet = TPP.makeSheet(settings, "Interior sheet side " + (side + 1));
    const sx = (settings.sheet.w - grid.cols * grid.w) / 2;
    const sy = (settings.sheet.h - grid.rows * grid.h) / 2;
    for (let i = 0; i < per; i++) {
      const pair = pairs[side * per + i];
      if (!pair) continue;
      const left = pages[pair.pages[0] - 1] || { n: pair.pages[0], type: "blank", html: "" };
      const right = pages[pair.pages[1] - 1] || { n: pair.pages[1], type: "blank", html: "" };
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const x = sx + col * grid.w;
      const y = sy + row * grid.h;
      sheet.appendChild(TPP.pageEl(left, settings, x, y, grid.rot));
      sheet.appendChild(TPP.pageEl(right, settings, x + settings.page.w, y, grid.rot));
      TPP.guides(sheet, settings, x, y, settings.page.w * 2, settings.page.h, 0);
    }
    preview.appendChild(sheet);
    if (settings.duplexBackSides) preview.appendChild(TPP.makeSheet(settings, "Duplex opposite side " + (side + 1)));
  }
};
TPP.renderCover = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const preview = document.getElementById("coverPreview");
  preview.innerHTML = "";
  const spineW = TPP.spineWidth(settings);
  const wrap = settings.wrapCover ? Number(settings.wrapInside) || 0 : 0;
  const w = settings.page.w * 2 + spineW + wrap * 2;
  const h = settings.page.h + wrap * 2;
  const grid = TPP.bestGrid(settings.sheet, { w, h });
  const copies = settings.coverCopiesMax ? grid.count : Math.min(grid.count, Math.max(1, Number(settings.coverCopies) || 1));
  document.getElementById("coverSummary").innerHTML =
    "Cover stock preview. Cover footprint " + w.toFixed(3) + " × " + h.toFixed(3) +
    " in, including spine/wrap/material allowances. " + copies + " cop" + (copies === 1 ? "y" : "ies") + " shown.";
  const sheet = TPP.makeSheet(settings, "Cover print sheet");
  const sx = copies === 1 ? (settings.sheet.w - w) / 2 : (settings.sheet.w - grid.cols * grid.w) / 2;
  const sy = copies === 1 ? (settings.sheet.h - h) / 2 : (settings.sheet.h - grid.rows * grid.h) / 2;
  const front = pages.find(function (p) { return p.role === "front"; });
  const back = pages.find(function (p) { return p.role === "back"; });
  for (let i = 0; i < copies; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);
    const x = sx + col * grid.w;
    const y = sy + row * grid.h;
    const ix = x + wrap;
    const iy = y + wrap;
    TPP.coverFootprint(sheet, settings, x, y, w, h);
    sheet.appendChild(TPP.pageEl(back, settings, ix, iy, false, false, { w: settings.page.w, h: settings.page.h }));
    if (spineW > 0) sheet.appendChild(TPP.spineEl(settings, ix + settings.page.w + spineW / 2, iy, settings.page.h));
    sheet.appendChild(TPP.pageEl(front, settings, ix + settings.page.w + spineW, iy, false, false, { w: settings.page.w, h: settings.page.h }));
    TPP.guides(sheet, settings, x, y, w, h, spineW);
    TPP.coverPerimeter(sheet, settings, x, y, w, h, spineW);
  }
  preview.appendChild(sheet);
};
