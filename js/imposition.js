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
TPP.signaturePlan = function (pages, signatureSize) {
  const interior = pages.filter(function (page) { return !page.cover; });
  const size = TPP.signatureSize(signatureSize);
  const signatures = [];
  for (let start = 0; start < interior.length; start += size) {
    const chunk = interior.slice(start, start + size);
    const pairs = TPP.pairs(chunk.length);
    const sheets = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const front = pairs[i];
      const back = pairs[i + 1] || { side: "back", pages: [0, 0] };
      const mapPages = function (pair) {
        return pair.pages.map(function (n) {
          return (chunk[n - 1] && chunk[n - 1].n) || 0;
        });
      };
      sheets.push({
        index: sheets.length,
        front: { side: front.side, pages: mapPages(front) },
        back: { side: back.side, pages: mapPages(back) }
      });
    }
    signatures.push({
      index: signatures.length,
      startPage: chunk[0] ? chunk[0].n : 0,
      endPage: chunk[chunk.length - 1] ? chunk[chunk.length - 1].n : 0,
      pages: chunk.map(function (page) { return page.n; }),
      sheets: sheets
    });
  }
  return signatures;
};
TPP.signatureMarkY = function (settings, signatureIndex, signatureCount, size) {
  const mark = size || 0.1;
  const top = 0.18;
  const bottom = Math.max(top, settings.page.h - mark - 0.18);
  if (signatureCount <= 1) return (top + bottom) / 2;
  return top + ((bottom - top) * signatureIndex / (signatureCount - 1));
};
TPP.signatureMarkColor = function (signatureIndex, signatureCount) {
  const start = [17, 17, 17];
  const end = [179, 38, 30];
  const ratio = signatureCount <= 1 ? 0 : signatureIndex / (signatureCount - 1);
  const mix = function (a, b) {
    return Math.round(a + (b - a) * ratio).toString(16).padStart(2, "0");
  };
  return "#" + mix(start[0], end[0]) + mix(start[1], end[1]) + mix(start[2], end[2]);
};
TPP.signatureSpineSide = function (side) {
  return side === "back";
};
TPP.signatureMark = function (sheet, settings, x, y, signatureIndex, signatureCount) {
  const mark = document.createElement("div");
  const size = Math.max(0.08, Math.min(0.14, settings.page.w * 0.08, settings.page.h * 0.08));
  mark.className = "signature-mark";
  mark.style.left = (x + settings.page.w - size / 2) + "in";
  mark.style.top = (y + TPP.signatureMarkY(settings, signatureIndex, signatureCount, size)) + "in";
  mark.style.width = size + "in";
  mark.style.height = size + "in";
  mark.style.background = TPP.signatureMarkColor(signatureIndex, signatureCount);
  sheet.appendChild(mark);
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
    [foldA, 0, foldA, yT], [foldA, h, foldA, yB],
    [foldB, 0, foldB, yT], [foldB, h, foldB, yB]
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
TPP.sewingGuidePositions = function (span, count) {
  const usableInset = Math.min(Math.max(span * 0.18, 0.12), Math.max(0.12, span * 0.32));
  const start = usableInset;
  const end = Math.max(start, span - usableInset);
  if (count <= 1 || end <= start) return [span / 2];
  return Array.from({ length: count }, function (_, index) {
    return start + ((end - start) * index / (count - 1));
  });
};
TPP.sewingGuides = function (sheet, settings, x, y, w, h, rotate90) {
  const count = TPP.sewingStations(settings.sewingStations);
  const long = rotate90 ? w : h;
  const positions = TPP.sewingGuidePositions(long, count);
  const len = Math.min(0.09, Math.max(0.045, Math.min(w, h) * 0.18));
  const thick = Math.min(0.02, len * 0.35);
  positions.forEach(function (pos) {
    const guide = document.createElement("div");
    guide.className = "sew-guide";
    if (rotate90) {
      guide.style.left = (x + pos - len / 2) + "in";
      guide.style.top = (y + h / 2 - thick / 2) + "in";
      guide.style.width = len + "in";
      guide.style.height = thick + "in";
    } else {
      guide.style.left = (x + w / 2 - thick / 2) + "in";
      guide.style.top = (y + pos - len / 2) + "in";
      guide.style.width = thick + "in";
      guide.style.height = len + "in";
    }
    sheet.appendChild(guide);
  });
};
TPP.guides = function (sheet, settings, x, y, w, h, spineW, rotate90) {
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
TPP.interiorBlock = function (sheet, settings, left, right, x, y, rotate90, rotate180) {
  const blockW = rotate90 ? settings.page.h : settings.page.w * 2;
  const blockH = rotate90 ? settings.page.w * 2 : settings.page.h;
  const shell = document.createElement("div");
  shell.style.position = "absolute";
  shell.style.left = x + "in";
  shell.style.top = y + "in";
  shell.style.width = blockW + "in";
  shell.style.height = blockH + "in";
  if (rotate180) {
    shell.style.transform = "rotate(180deg)";
    shell.style.transformOrigin = "center center";
  }
  shell.appendChild(TPP.pageEl(left, settings, 0, 0, rotate90, false));
  shell.appendChild(TPP.pageEl(right, settings, settings.page.w, 0, rotate90, false));
  sheet.appendChild(shell);
};
TPP.renderInterior = function () {
  const settings = TPP.settings();
  const pages = TPP.buildPages();
  const preview = document.getElementById("interiorPreview");
  preview.innerHTML = "";
  const signatures = TPP.signaturePlan(pages, settings.signatureSize);
  const frontBlocks = signatures.flatMap(function (signature) {
    return signature.sheets.map(function (sheet) {
      return { signature: signature.index, sheet: sheet.index, side: "front", pages: sheet.front.pages };
    });
  });
  const backBlocks = signatures.flatMap(function (signature) {
    return signature.sheets.map(function (sheet) {
      return { signature: signature.index, sheet: sheet.index, side: "back", pages: sheet.back.pages };
    });
  });
  const unit = { w: settings.page.w * 2, h: settings.page.h };
  const grid = TPP.bestGrid(settings.sheet, unit);
  const per = grid.count;
  const printSheets = Math.ceil(frontBlocks.length / per);
  document.getElementById("interiorSummary").innerHTML =
    "<strong>" + pages.length + " book pages</strong>. " + signatures.length + " signature" + (signatures.length === 1 ? "" : "s") +
    " at " + settings.signatureSize + " pages max. Interior booklet imposition has " + (frontBlocks.length * 2) +
    " front/back side blocks. " + per + " blocks fit per sheet side. " +
    (settings.duplexBackSides ? "Duplex output keeps front/back pages aligned for automatic duplex printing." : "Non-duplex output rotates the reverse sides for manual folding and feeding.");
  const renderSidePage = function (label, blocks, pageIndex, rotate180) {
    const sheet = TPP.makeSheet(settings, label);
    sheet.classList.add("interior-sheet");
    const sx = (settings.sheet.w - grid.cols * grid.w) / 2;
    const sy = (settings.sheet.h - grid.rows * grid.h) / 2;
    for (let i = 0; i < per; i++) {
      const block = blocks[pageIndex * per + i];
      if (!block) continue;
      const left = pages[block.pages[0] - 1] || { n: block.pages[0], type: "blank", html: "" };
      const right = pages[block.pages[1] - 1] || { n: block.pages[1], type: "blank", html: "" };
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const x = sx + col * grid.w;
      const y = sy + row * grid.h;
      TPP.interiorBlock(sheet, settings, left, right, x, y, grid.rot, rotate180);
      if (settings.showSignatureOverlay) {
        const tag = document.createElement("div");
        tag.className = "sheet-title";
        tag.style.left = (x + 0.08) + "in";
        tag.style.top = (y + 0.08) + "in";
        tag.textContent = "Sig " + (block.signature + 1) + " · Sheet " + (block.sheet + 1) + " · " + block.side;
        sheet.appendChild(tag);
      }
      const guideW = grid.rot ? settings.page.h : settings.page.w * 2;
      const guideH = grid.rot ? settings.page.w * 2 : settings.page.h;
      if (TPP.signatureSpineSide(block.side)) {
        TPP.signatureMark(sheet, settings, x, y, block.signature, signatures.length);
      }
      const showSpineGuides = settings.showFoldGuides && TPP.signatureSpineSide(block.side);
      if (showSpineGuides && block.sheet === 0) {
        TPP.sewingGuides(sheet, settings, x, y, guideW, guideH, grid.rot);
      }
      TPP.guides(sheet, Object.assign({}, settings, {
        showFoldGuides: false
      }), x, y, guideW, guideH, 0, grid.rot);
    }
    preview.appendChild(sheet);
  };
  for (let side = 0; side < printSheets; side++) {
    renderSidePage("Interior sheet front " + (side + 1), frontBlocks, side, false);
    renderSidePage(settings.duplexBackSides ? "Interior sheet back " + (side + 1) : "Interior reverse side " + (side + 1), backBlocks, side, !settings.duplexBackSides);
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
    TPP.guides(sheet, Object.assign({}, settings, { showFoldGuides: false }), x, y, w, h, spineW, false);
    TPP.coverPerimeter(sheet, settings, x, y, w, h, spineW);
    TPP.coverCutSegments(sheet, settings, x, y, w, h, spineW);
  }
  preview.appendChild(sheet);
};
