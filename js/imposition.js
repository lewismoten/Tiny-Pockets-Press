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
TPP.coverCutSegment = function (sheet, cls, x1, y1, x2, y2, color, thickness) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const segment = document.createElement("div");
  segment.className = cls;
  segment.style.left = x1 + "in";
  segment.style.top = y1 + "in";
  segment.style.width = Math.sqrt(dx * dx + dy * dy) + "in";
  segment.style.height = thickness + "in";
  segment.style.background = color;
  segment.style.transform = "rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI) + "deg)";
  sheet.appendChild(segment);
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
TPP.svgLine = function (svg, x1, y1, x2, y2, color, width) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width || "0.018");
  line.setAttribute("stroke-linecap", "square");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(line);
};
TPP.coverCutGeometry = function (settings) {
  const wrapCap = Math.min(settings.page.w, settings.page.h) * 0.25;
  const wrap = Math.min(Math.max(0, Number(settings.wrapInside) || 0), wrapCap);
  const board = Math.max(0, Number(settings.boardThickness) || 0);
  const inset = wrap;
  const thickness = inset && board ? Math.min(inset, board) : 0;
  return { inset: inset, thickness: thickness };
};
TPP.coverWrap = function (settings) {
  const wrapCap = Math.min(settings.page.w, settings.page.h) * 0.25;
  return settings.wrapCover ? Math.min(Math.max(0, Number(settings.wrapInside) || 0), wrapCap) : 0;
};
TPP.coverCornerGeometry = function (settings, w, h) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  const t = geo.thickness;
  if (!inset || !t) return { inset: inset, thickness: t, tip: 0 };
  return { inset: inset, thickness: t, tip: Math.min(2 * inset - t, w / 2, h / 2) };
};
TPP.coverCutOutlinePath = function (settings, w, h) {
  const geo = TPP.coverCornerGeometry(settings, w, h);
  const inset = geo.inset;
  const t = geo.thickness;
  if (!inset || !t) return "M0 0H" + w + "V" + h + "H0Z";
  const d = geo.tip;
  return [
    "M", d, 0,
    "H", w - d,
    "L", w - inset, inset - t,
    "V", inset,
    "H", w - inset + t,
    "L", w, d,
    "V", h - d,
    "L", w - inset + t, h - inset,
    "H", w - inset,
    "V", h - inset + t,
    "L", w - d, h,
    "H", d,
    "L", inset, h - inset + t,
    "V", h - inset,
    "H", inset - t,
    "L", 0, h - d,
    "V", d,
    "L", inset - t, inset,
    "H", inset,
    "V", inset - t,
    "Z"
  ].join(" ");
};
TPP.coverCutClipPath = function (settings, w, h) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  const t = geo.thickness;
  if (!inset || !t) return "";
  const xL = inset;
  const xR = w - inset;
  const yT = inset;
  const yB = h - inset;
  const leftOuter = inset - t;
  const rightOuter = w - inset + t;
  const topOuter = inset - t;
  const bottomOuter = h - inset + t;
  const topRun = Math.min(topOuter, Math.max(0, w / 2 - xL), Math.max(0, xR - w / 2));
  const sideRun = Math.min(leftOuter, Math.max(0, h / 2 - yT), Math.max(0, yB - h / 2));
  const topEdgeY = Math.max(0, topOuter - topRun);
  const bottomEdgeY = Math.min(h, bottomOuter + topRun);
  const leftEdgeX = Math.max(0, leftOuter - sideRun);
  const rightEdgeX = Math.min(w, rightOuter + sideRun);
  const trim = Math.min(0.01, w / 200, h / 200);
  const ix = function (value) { return Math.max(trim, Math.min(w - trim, value)); };
  const iy = function (value) { return Math.max(trim, Math.min(h - trim, value)); };
  const pct = function (value, total) { return (value / total * 100).toFixed(4) + "%"; };
  const pt = function (x, y) { return pct(ix(x), w) + " " + pct(iy(y), h); };
  return "polygon(" + [
    pt(xL + topRun, topEdgeY),
    pt(xR - topRun, topEdgeY),
    pt(xR, topOuter),
    pt(xR, yT),
    pt(rightOuter, yT),
    pt(rightEdgeX, yT + sideRun),
    pt(rightEdgeX, yB - sideRun),
    pt(rightOuter, yB),
    pt(xR, yB),
    pt(xR, bottomOuter),
    pt(xR - topRun, bottomEdgeY),
    pt(xL + topRun, bottomEdgeY),
    pt(xL, bottomOuter),
    pt(xL, yB),
    pt(leftOuter, yB),
    pt(leftEdgeX, yB - sideRun),
    pt(leftEdgeX, yT + sideRun),
    pt(leftOuter, yT),
    pt(xL, yT),
    pt(xL, topOuter)
  ].join(", ") + ")";
};
TPP.coverCutLines = function (settings, w, h, spineW) {
  const geo = TPP.coverCutGeometry(settings);
  const inset = geo.inset;
  const t = geo.thickness;
  if (inset <= 0 || t <= 0) return [];
  const xL = inset;
  const xR = w - inset;
  const yT = inset;
  const yB = h - inset;
  const pageW = settings.page.w;
  const foldA = inset + pageW;
  const foldB = inset + pageW + spineW;
  const leftOuter = inset - t;
  const rightOuter = w - inset + t;
  const topOuter = inset - t;
  const bottomOuter = h - inset + t;
  const topRun = Math.min(topOuter, Math.max(0, w / 2 - xL), Math.max(0, xR - w / 2));
  const sideRun = Math.min(leftOuter, Math.max(0, h / 2 - yT), Math.max(0, yB - h / 2));
  const topEdgeY = Math.max(0, topOuter - topRun);
  const bottomEdgeY = Math.min(h, bottomOuter + topRun);
  const leftEdgeX = Math.max(0, leftOuter - sideRun);
  const rightEdgeX = Math.min(w, rightOuter + sideRun);
  return [
    [xL, yT - t, xL, yT], [xL, yT, xL - t, yT],
    [xR, yT - t, xR, yT], [xR, yT, xR + t, yT],
    [xL, yB + t, xL, yB], [xL, yB, xL - t, yB],
    [xR, yB + t, xR, yB], [xR, yB, xR + t, yB],
    [xL + topRun, topEdgeY, xL, topOuter],
    [xR - topRun, topEdgeY, xR, topOuter],
    [xL + topRun, bottomEdgeY, xL, bottomOuter],
    [xR - topRun, bottomEdgeY, xR, bottomOuter],
    [leftEdgeX, yT + sideRun, leftOuter, yT],
    [rightEdgeX, yT + sideRun, rightOuter, yT],
    [leftEdgeX, yB - sideRun, leftOuter, yB],
    [rightEdgeX, yB - sideRun, rightOuter, yB],
    [foldA, 0, foldA, t], [foldA, h, foldA, h - t],
    [foldB, 0, foldB, t], [foldB, h, foldB, h - t]
  ];
};
TPP.coverPerimeter = function (sheet, settings, x, y, w, h, spineW) {
  if (!settings.coverPerimeterOn) return;
  const outline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const color = TPP.coverCutColor(settings);
  outline.className = "cover-perimeter";
  outline.style.position = "absolute";
  outline.style.left = x + "in";
  outline.style.top = y + "in";
  outline.style.width = w + "in";
  outline.style.height = h + "in";
  outline.style.zIndex = "40";
  outline.style.overflow = "visible";
  outline.style.pointerEvents = "none";
  outline.style.display = "block";
  outline.setAttribute("viewBox", "0 0 " + w + " " + h);
  TPP.svgPath(outline, "M0 0H" + w + "V" + h + "H0Z", color, "0.016");
  sheet.appendChild(outline);
};
TPP.coverCutSegments = function (sheet, settings, x, y, w, h, spineW) {
  const color = TPP.coverCutColor(settings);
  TPP.coverCutLines(settings, w, h, spineW).forEach(function (line) {
    TPP.coverCutSegment(sheet, "cover-cut", x + line[0], y + line[1], x + line[2], y + line[3], color, 0.014);
  });
};
TPP.coverArtworkGroup = function (settings, x, y, w, h) {
  const group = document.createElement("div");
  group.className = "cover-artwork";
  group.style.left = x + "in";
  group.style.top = y + "in";
  group.style.width = w + "in";
  group.style.height = h + "in";
  const clipPath = TPP.coverCutClipPath(settings, w, h);
  if (clipPath) group.style.clipPath = clipPath;
  return group;
};
TPP.coverFootprint = function (sheet, settings, x, y, w, h) {
  const footprint = document.createElement("div");
  footprint.className = "cover-footprint";
  footprint.style.left = x + "in";
  footprint.style.top = y + "in";
  footprint.style.width = w + "in";
  footprint.style.height = h + "in";
  TPP.applyVars(footprint, settings);
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
      const wrap = TPP.coverWrap(settings);
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
  const wrap = TPP.coverWrap(settings);
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
    const artwork = TPP.coverArtworkGroup(settings, x, y, w, h);
    sheet.appendChild(artwork);
    TPP.coverFootprint(artwork, settings, 0, 0, w, h);
    artwork.appendChild(TPP.pageEl(back, settings, wrap, wrap, false, false, { w: settings.page.w, h: settings.page.h }));
    if (spineW > 0) artwork.appendChild(TPP.spineEl(settings, wrap + settings.page.w + spineW / 2, wrap, settings.page.h));
    artwork.appendChild(TPP.pageEl(front, settings, wrap + settings.page.w + spineW, wrap, false, false, { w: settings.page.w, h: settings.page.h }));
    TPP.guides(sheet, settings, x, y, w, h, spineW);
    TPP.coverPerimeter(sheet, settings, x, y, w, h, spineW);
    TPP.coverCutSegments(sheet, settings, x, y, w, h, spineW);
  }
  preview.appendChild(sheet);
};
