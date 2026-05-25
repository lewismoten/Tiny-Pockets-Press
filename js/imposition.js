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
TPP.coverPerimeter = function (sheet, settings, x, y, w, h) {
  if (!settings.coverPerimeterOn) return;
  const outline = document.createElement("div");
  outline.className = "cover-perimeter";
  outline.style.left = x + "in";
  outline.style.top = y + "in";
  outline.style.width = w + "in";
  outline.style.height = h + "in";
  outline.style.borderColor = settings.coverBorder;
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
      TPP.guide(sheet, "fold v", x + settings.page.w, y, 0, h);
      TPP.guide(sheet, "fold v", x + settings.page.w + spineW, y, 0, h);
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
  const board = settings.wrapCover ? Number(settings.boardThickness) || 0 : 0;
  const w = settings.page.w * 2 + spineW + wrap * 2 + board * 2;
  const h = settings.page.h + wrap * 2 + board * 2;
  const grid = TPP.bestGrid(settings.sheet, { w, h });
  const copies = settings.coverCopiesMax ? grid.count : Math.min(grid.count, Math.max(1, Number(settings.coverCopies) || 1));
  document.getElementById("coverSummary").innerHTML =
    "Cover stock preview. Cover footprint " + w.toFixed(3) + " × " + h.toFixed(3) +
    " in, including spine/wrap/material allowances. " + copies + " cop" + (copies === 1 ? "y" : "ies") + " shown.";
  const sheet = TPP.makeSheet(settings, "Cover print sheet");
  const sx = (settings.sheet.w - grid.cols * grid.w) / 2;
  const sy = (settings.sheet.h - grid.rows * grid.h) / 2;
  const front = pages.find(function (p) { return p.role === "front"; });
  const back = pages.find(function (p) { return p.role === "back"; });
  for (let i = 0; i < copies; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);
    const x = sx + col * grid.w;
    const y = sy + row * grid.h;
    const ix = x + wrap + board;
    const iy = y + wrap + board;
    TPP.coverFootprint(sheet, settings, x, y, w, h);
    sheet.appendChild(TPP.pageEl(back, settings, ix, iy, false, false, { w: settings.page.w, h: settings.page.h }));
    if (spineW > 0) sheet.appendChild(TPP.spineEl(settings, ix + settings.page.w + spineW / 2, iy, settings.page.h));
    sheet.appendChild(TPP.pageEl(front, settings, ix + settings.page.w + spineW, iy, false, false, { w: settings.page.w, h: settings.page.h }));
    TPP.guides(sheet, settings, x, y, w, h, spineW);
    if (settings.wrapCover) {
      const cut = 0.16;
      [[x, y, 45], [x + w - cut, y, -45], [x, y + h - 0.01, -45], [x + w - cut, y + h - 0.01, 45]].forEach(function (corner) {
        const el = document.createElement("div");
        el.className = "cut";
        el.style.left = corner[0] + "in";
        el.style.top = corner[1] + "in";
        el.style.width = cut + "in";
        el.style.height = "0.012in";
        el.style.transform = "rotate(" + corner[2] + "deg)";
        sheet.appendChild(el);
      });
    }
    TPP.coverPerimeter(sheet, settings, x, y, w, h);
  }
  preview.appendChild(sheet);
};
