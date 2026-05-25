const $ = id => document.getElementById(id);

const LIBRARY_KEY = "tinyPocketsPressLibraryV3";
const ACTIVE_KEY = "tinyPocketsPressActiveBookV3";

const fonts = [
  ["Georgia, serif", "Georgia"],
  ["'Times New Roman', serif", "Times New Roman"],
  ["Garamond, serif", "Garamond"],
  ["Arial, sans-serif", "Arial"],
  ["Verdana, sans-serif", "Verdana"],
  ["'Courier New', monospace", "Courier New"]
];

const paperPresets = {
  white: { label: "White", bg: "#ffffff", text: "#231f20" },
  eggshell: { label: "Eggshell White", bg: "#fff8e8", text: "#231f20" },
  aged: { label: "Aged Paper", bg: "#ead8b4", text: "#2c2018" },
  cream: { label: "Cream", bg: "#f7ecd2", text: "#2a241d" },
  parchment: { label: "Parchment", bg: "#efe0bd", text: "#2c2018" },
  gray: { label: "Soft Gray", bg: "#eeeeec", text: "#242424" }
};

const textures = {
  none: "None",
  noise: "Soft Noise",
  aged: "Aged Edges",
  fiber: "Paper Fibers"
};

const sizes = {
  "half-inch": { w: 0.5, h: 0.5 },
  "one-inch": { w: 1, h: 1 },
  "pocket-16": { w: 2.125, h: 2.75 },
  "business-card": { w: 2, h: 3.5 },
  "sixteenth-letter": { w: 2.125, h: 2.75 },
  "eighth-letter": { w: 2.75, h: 4.25 },
  "quarter-letter": { w: 4.25, h: 5.5 },
  "a7": { w: 2.913, h: 4.134 },
  "a6": { w: 4.134, h: 5.827 }
};

const sheetSizes = {
  "letter": { w: 8.5, h: 11 },
  "legal": { w: 8.5, h: 14 },
  "a4": { w: 8.267, h: 11.693 }
};

function uid() {
  return "book-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

const sampleBook = {
  id: uid(),
  title: "Santa’s Little OSHA Violation",
  author: "Lewis Moten",
  pubDate: "2026-05-24",
  publisher: "Tiny Pockets Press",
  copyright: "© 2026 Lewis Moten. All rights reserved.",
  printing: "First Printing",
  volume: "",
  number: "No. 1048",
  seriesName: "100 Word Stories Weekly Challenge",
  includeToc: true,
  pageSize: "one-inch",
  sheetSize: "letter",
  customPageWidth: 1,
  customPageHeight: 1,
  margin: 0.08,
  fontFamily: "Georgia, serif",
  paperPreset: "eggshell",
  texture: "aged",
  pageBg: "#fff8e8",
  pageTextColor: "#231f20",
  bodyFontSize: 5.5,
  titlePageFontSize: 7,
  showPageNumbers: true,
  showCutGuides: true,
  showFoldGuides: true,
  coverBg: "#7b1f2a",
  coverBg2: "#3c1118",
  coverTextColor: "#fff8e8",
  coverBorderColor: "#fff8e8",
  coverTitleSize: 8,
  coverAuthorSize: 4.5,
  coverSeriesSize: 3.8,
  coverPublisherSize: 3.8,
  showBorder: true,
  coverImageData: "",
  imageX: 0,
  imageY: 20,
  imageZoom: 85,
  tocFontSize: 4.5,
  tocTextColor: "#231f20",
  chapterTitleSize: 6,
  chapterTitleColor: "#231f20",
  pageNumberSize: 3.5,
  pageNumberColor: "#6c625a",
  stapleLimit: 16,
  signatureSize: 16,
  paperThickness: 0.004,
  forceSpine: false,
  chapters: [
    {
      id: uid(),
      title: "Santa’s Little OSHA Violation",
      text: "A jolly \u201cHo-ho-ho\u201d came from behind, followed by \u201cHidey ho, neighbor!\u201d\n\n\u201cHello Santa,\u201d little Timmy replied.\n\n\u201cWhy the long face?\u201d Santa asked.\n\nTimmy showed him a block of wood. \u201cI\u2019m building a pinewood derby car, but I have no tools.\u201d\n\nSanta put his hands on his waist and made grunting sounds, followed by the order: \u201cNever give up. Never surrender!\u201d\n\nSanta went into his bag and grabbed a few presents, handing them over. Timmy quickly ripped open the packages, finding a chainsaw, angle grinder, nail gun, industrial CNC router, plasma cutter, and a flame thrower, while Santa shouted, \u201cMore power!\u201d",
      imageData: "",
      imagePlacement: "below-title",
      imageWidth: 70
    }
  ]
};

let library = [];
let activeBook = null;
let readerIndex = 0;
let currentView = "editor";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadLibrary() {
  try {
    library = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
  } catch {
    library = [];
  }

  if (!Array.isArray(library) || library.length === 0) {
    library = [clone(sampleBook)];
    saveLibrary();
  }

  const activeId = localStorage.getItem(ACTIVE_KEY) || library[0].id;
  activeBook = library.find(b => b.id === activeId) || library[0];
}

function saveLibrary() {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

function setActiveBook(book) {
  activeBook = book;
  localStorage.setItem(ACTIVE_KEY, book.id);
  loadBookIntoForm();
  renderAll();
}

function normalizeBook(book) {
  return { ...clone(sampleBook), ...book, id: book.id || uid(), chapters: Array.isArray(book.chapters) && book.chapters.length ? book.chapters : clone(sampleBook.chapters) };
}

function populateSelects() {
  $("fontFamily").innerHTML = fonts.map(([value, label]) => `<option value="${escapeAttr(value)}">${label}</option>`).join("");
  $("paperPreset").innerHTML = Object.entries(paperPresets).map(([value, p]) => `<option value="${value}">${p.label}</option>`).join("");
  $("texture").innerHTML = Object.entries(textures).map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/`/g, "&#096;");
}

function fields() {
  return [
    "title", "author", "pubDate", "publisher", "copyright", "printing", "volume", "number", "seriesName",
    "includeToc", "pageSize", "sheetSize", "customPageWidth", "customPageHeight", "margin", "fontFamily",
    "paperPreset", "texture", "pageBg", "pageTextColor", "bodyFontSize", "titlePageFontSize",
    "showPageNumbers", "showCutGuides", "showFoldGuides", "coverBg", "coverBg2", "coverTextColor",
    "coverBorderColor", "coverTitleSize", "coverAuthorSize", "coverSeriesSize", "coverPublisherSize",
    "showBorder", "imageX", "imageY", "imageZoom", "tocFontSize", "tocTextColor", "chapterTitleSize",
    "chapterTitleColor", "pageNumberSize", "pageNumberColor", "stapleLimit", "signatureSize",
    "paperThickness", "forceSpine"
  ];
}

function loadBookIntoForm() {
  const b = activeBook;
  fields().forEach(id => {
    const el = $(id);
    if (!el) return;
    if (el.type === "checkbox") el.checked = Boolean(b[id]);
    else el.value = b[id] ?? "";
  });
  document.querySelector(".custom-size").hidden = $("pageSize").value !== "custom";
  renderChapterEditor();
}

function syncFormToBook() {
  const b = activeBook;
  fields().forEach(id => {
    const el = $(id);
    if (!el) return;
    if (el.type === "checkbox") b[id] = el.checked;
    else if (el.type === "number" || el.type === "range") b[id] = Number(el.value);
    else b[id] = el.value;
  });
  b.chapters = readChaptersFromEditor();
  saveLibrary();
}

function readSettings() {
  syncFormToBook();
  const b = activeBook;
  const page = b.pageSize === "custom" ? { w: Number(b.customPageWidth), h: Number(b.customPageHeight) } : sizes[b.pageSize];
  return {
    ...b,
    page: {
      w: Math.max(0.5, Number(page.w) || 1),
      h: Math.max(0.5, Number(page.h) || 1)
    },
    sheet: sheetSizes[b.sheetSize] || sheetSizes.letter,
    signatureSize: Math.max(4, Math.ceil(Number(b.signatureSize) / 4) * 4),
  };
}

function renderChapterEditor() {
  const wrap = $("chaptersEditor");
  wrap.innerHTML = activeBook.chapters.map((ch, idx) => `
    <article class="chapter-card" data-chapter-id="${ch.id}">
      <div class="chapter-card-header">
        <h3>Chapter ${idx + 1}</h3>
        <div class="chapter-actions">
          <button data-action="up">↑</button>
          <button data-action="down">↓</button>
          <button data-action="remove">Remove</button>
        </div>
      </div>
      <label>Chapter Title <input class="chapter-title" value="${escapeAttr(ch.title || "")}"></label>
      <label>Chapter Text
        <textarea class="chapter-text" rows="10">${escapeHtml(ch.text || "")}</textarea>
      </label>
      <div class="two-col">
        <label>Image Placement
          <select class="chapter-image-placement">
            <option value="none" ${ch.imagePlacement === "none" ? "selected" : ""}>No Image</option>
            <option value="own-page" ${ch.imagePlacement === "own-page" ? "selected" : ""}>Own Page</option>
            <option value="below-title" ${ch.imagePlacement === "below-title" ? "selected" : ""}>Below Title</option>
          </select>
        </label>
        <label>Image Width (%) <input class="chapter-image-width" type="number" min="10" max="100" step="1" value="${ch.imageWidth ?? 70}"></label>
      </div>
      <label>Chapter Image <input class="chapter-image" type="file" accept="image/*"></label>
      ${ch.imageData ? `<img class="chapter-img-preview" src="${ch.imageData}" alt="" style="max-width:140px;border-radius:10px;">` : ""}
    </article>
  `).join("");
}

function readChaptersFromEditor() {
  const cards = [...document.querySelectorAll(".chapter-card")];
  return cards.map(card => {
    const existing = activeBook.chapters.find(c => c.id === card.dataset.chapterId) || {};
    return {
      id: card.dataset.chapterId || uid(),
      title: card.querySelector(".chapter-title").value,
      text: card.querySelector(".chapter-text").value,
      imageData: existing.imageData || "",
      imagePlacement: card.querySelector(".chapter-image-placement").value,
      imageWidth: Number(card.querySelector(".chapter-image-width").value) || 70
    };
  });
}

function safeMarkdown(text) {
  const raw = window.marked ? marked.parse(text || "", { gfm: true, breaks: true }) : escapeHtml(text || "").replace(/\n/g, "<br>");
  return window.DOMPurify ? DOMPurify.sanitize(raw, { ADD_TAGS: ["u"], ADD_ATTR: ["style"] }) : raw;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function makePage(type, html, n, extra = {}) {
  return { type, html, n, ...extra };
}

function estimateCharsPerPage(s) {
  const usableW = Math.max(0.1, s.page.w - s.margin * 2);
  const usableH = Math.max(0.1, s.page.h - s.margin * 2 - .05);
  const charsPerLine = Math.floor((usableW * 72) / (s.bodyFontSize * .52));
  const lines = Math.floor((usableH * 72) / (s.bodyFontSize * 1.35));
  return Math.max(12, charsPerLine * lines);
}

function chunkMarkdown(text, charsPerPage) {
  const blocks = String(text || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const block of blocks) {
    if ((current + "\n\n" + block).trim().length > charsPerPage && current) {
      chunks.push(current.trim());
      current = block;
    } else {
      current = (current + "\n\n" + block).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [""];
}

function chapterImageHtml(ch, s) {
  if (!ch.imageData || ch.imagePlacement === "none") return "";
  const width = Math.max(10, Math.min(100, Number(ch.imageWidth) || 70));
  return `<img class="chapter-img" src="${ch.imageData}" style="width:${width}%;max-height:${Math.max(.1, s.page.h - s.margin * 2 - .18)}in;margin:.04in auto;object-fit:contain;">`;
}

function buildLogicalPages(s) {
  const pages = [];
  const series = [s.seriesName, s.number].filter(Boolean).join(" ");
  const imprintBits = [s.publisher, formatDate(s.pubDate), s.printing, s.volume, s.number, s.copyright].filter(Boolean);

  const coverHtml = `
    ${s.coverImageData ? `<img class="cover-img" src="${s.coverImageData}" style="width:${s.imageZoom}%; margin-left:${s.imageX}%; margin-top:${s.imageY}%;">` : ""}
    <div class="cover-content">
      ${series ? `<div class="cover-series">${escapeHtml(series)}</div>` : ""}
      <div class="cover-title">${escapeHtml(s.title)}</div>
      ${s.author ? `<div class="cover-author">by ${escapeHtml(s.author)}</div>` : ""}
      ${s.publisher ? `<div class="cover-publisher">${escapeHtml(s.publisher)}</div>` : ""}
    </div>`;
  pages.push(makePage("cover", coverHtml, 1, { isCover: true }));

  const titleHtml = `
    <div class="story-title">${escapeHtml(s.title)}</div>
    <div class="story-meta">
      ${s.author ? `By ${escapeHtml(s.author)}<br>` : ""}
      ${series ? `${escapeHtml(series)}<br>` : ""}
      ${s.publisher ? `${escapeHtml(s.publisher)}<br>` : ""}
      ${formatDate(s.pubDate)}
    </div>
    <div class="copyright-page">${imprintBits.map(escapeHtml).join("<br>")}</div>`;
  pages.push(makePage("text title-page", titleHtml, 2));

  if (s.includeToc && s.chapters.length > 1) {
    const tocItems = s.chapters.map((ch, idx) => `<li><span>${escapeHtml(ch.title || "Untitled")}</span><span>${idx + 1}</span></li>`).join("");
    pages.push(makePage("text", `<div class="story-title">Contents</div><ol class="toc-list">${tocItems}</ol>`, pages.length + 1));
  }

  for (const ch of s.chapters) {
    if (ch.imageData && ch.imagePlacement === "own-page") {
      pages.push(makePage("text", `<div class="chapter-heading">${escapeHtml(ch.title || "")}</div>${chapterImageHtml(ch, s)}`, pages.length + 1));
    } else {
      pages.push(makePage("text", `<div class="chapter-heading">${escapeHtml(ch.title || "")}</div>${chapterImageHtml(ch, s)}`, pages.length + 1));
    }

    const chunks = chunkMarkdown(ch.text, estimateCharsPerPage(s));
    for (const chunk of chunks) {
      pages.push(makePage("text", `<div class="story-text">${safeMarkdown(chunk)}</div>`, pages.length + 1));
    }
  }

  while (pages.length % 4 !== 0) pages.push(makePage("blank", `<span>Blank</span>`, pages.length + 1));
  return pages;
}

function bestGrid(sheet, page) {
  const orientations = [
    { rotate: false, w: page.w, h: page.h },
    { rotate: true, w: page.h, h: page.w }
  ];
  let best = null;
  for (const o of orientations) {
    const cols = Math.floor(sheet.w / o.w);
    const rows = Math.floor(sheet.h / o.h);
    const count = cols * rows;
    if (!best || count > best.count) best = { ...o, cols, rows, count };
  }
  return best;
}

function pageElement(page, s, x, y, rotate = false, staticMode = false) {
  const div = document.createElement("div");
  div.className = `book-page ${page.type} ${s.showBorder && page.type.includes("cover") ? "framed" : ""} texture-${s.texture}`;
  div.style.left = staticMode ? "0" : `${x}in`;
  div.style.top = staticMode ? "0" : `${y}in`;
  div.style.width = `${s.page.w}in`;
  div.style.height = `${s.page.h}in`;
  div.style.setProperty("--page-margin", `${s.margin}in`);
  div.style.setProperty("--page-bg", s.pageBg);
  div.style.setProperty("--page-text", s.pageTextColor);
  div.style.setProperty("--cover-bg", s.coverBg);
  div.style.setProperty("--cover-bg2", s.coverBg2);
  div.style.setProperty("--cover-text", s.coverTextColor);
  div.style.setProperty("--cover-border", s.coverBorderColor);
  div.style.setProperty("--cover-title-size", `${s.coverTitleSize}pt`);
  div.style.setProperty("--cover-author-size", `${s.coverAuthorSize}pt`);
  div.style.setProperty("--cover-series-size", `${s.coverSeriesSize}pt`);
  div.style.setProperty("--cover-publisher-size", `${s.coverPublisherSize}pt`);
  div.style.setProperty("--title-page-font-size", `${s.titlePageFontSize}pt`);
  div.style.setProperty("--toc-font-size", `${s.tocFontSize}pt`);
  div.style.setProperty("--toc-text-color", s.tocTextColor);
  div.style.setProperty("--chapter-title-size", `${s.chapterTitleSize}pt`);
  div.style.setProperty("--chapter-title-color", s.chapterTitleColor);
  div.style.setProperty("--page-number-size", `${s.pageNumberSize}pt`);
  div.style.setProperty("--page-number-color", s.pageNumberColor);
  div.style.fontSize = `${s.bodyFontSize}pt`;
  div.style.fontFamily = s.fontFamily;

  if (rotate && !staticMode) {
    div.style.transformOrigin = "top left";
    div.style.transform = `translate(${s.page.h}in, 0) rotate(90deg)`;
  }

  const inner = document.createElement("div");
  inner.className = "page-inner";
  if (page.type.includes("blank")) inner.classList.add("blank");
  inner.innerHTML = page.html;

  if (s.showPageNumbers && !page.type.includes("cover") && !page.type.includes("blank")) {
    inner.insertAdjacentHTML("beforeend", `<div class="page-number">${page.n}</div>`);
  }

  div.appendChild(inner);
  return div;
}

function guideLine(sheet, className, left, top, width, height) {
  const g = document.createElement("div");
  g.className = className;
  g.style.left = `${left}in`;
  g.style.top = `${top}in`;
  g.style.width = `${width}in`;
  g.style.height = `${height}in`;
  sheet.appendChild(g);
}

function addGridGuides(sheet, s, grid, startX, startY) {
  if (s.showCutGuides) {
    const len = Math.min(.12, grid.w / 5, grid.h / 5);
    for (let c = 0; c <= grid.cols; c++) {
      const x = startX + c * grid.w;
      guideLine(sheet, "cut-guide", x - .004, startY - len, .008, len);
      guideLine(sheet, "cut-guide", x - .004, startY + grid.rows * grid.h, .008, len);
    }
    for (let r = 0; r <= grid.rows; r++) {
      const y = startY + r * grid.h;
      guideLine(sheet, "cut-guide", startX - len, y - .004, len, .008);
      guideLine(sheet, "cut-guide", startX + grid.cols * grid.w, y - .004, len, .008);
    }
  }
  if (s.showFoldGuides) {
    for (let c = 1; c < grid.cols; c++) guideLine(sheet, "fold-guide vertical", startX + c * grid.w, startY, 0, grid.rows * grid.h);
    for (let r = 1; r < grid.rows; r++) guideLine(sheet, "fold-guide horizontal", startX, startY + r * grid.h, grid.cols * grid.w, 0);
  }
}

function addSpineGuide(sheet, s, x, y, slotHeight, signatureIndex, signatureCount) {
  const h = Math.max(.06, Math.min(.20, slotHeight / Math.max(signatureCount + 2, 1)));
  const usable = slotHeight - h;
  const top = y + (signatureCount <= 1 ? usable / 2 : usable * signatureIndex / (signatureCount - 1));
  const mark = document.createElement("div");
  mark.className = "spine-guide";
  mark.style.left = `${x}in`;
  mark.style.top = `${top}in`;
  mark.style.height = `${h}in`;
  sheet.appendChild(mark);
}

function renderPrintPreview() {
  const s = readSettings();
  const pages = buildLogicalPages(s);
  const grid = bestGrid(s.sheet, s.page);
  const perSide = Math.max(1, grid.count);
  const totalSides = Math.ceil(pages.length / perSide);
  const hasSpine = s.forceSpine || pages.length > s.stapleLimit;
  const signatureCount = Math.ceil(pages.length / s.signatureSize);
  const preview = $("printPreview");
  preview.innerHTML = "";

  $("summary").innerHTML = `
    <strong>${pages.length} book pages</strong>. ${perSide} page${perSide === 1 ? "" : "s"} fit per ${s.sheet.w} × ${s.sheet.h} in sheet side.
    Grid: ${grid.cols} × ${grid.rows}${grid.rotate ? ", rotated 90°" : ""}.
    Finished page: ${s.page.w.toFixed(2)} × ${s.page.h.toFixed(2)} in.
    Binding: ${hasSpine ? "spine/sewn signature guides shown as small black edge blocks only" : "stapled/folded booklet; no spine"}.
  `;

  const scale = Math.min(1, 900 / (s.sheet.w * 96));
  for (let side = 0; side < totalSides; side++) {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.dataset.pdfPage = "true";
    sheet.style.width = `${s.sheet.w}in`;
    sheet.style.height = `${s.sheet.h}in`;
    sheet.style.transformOrigin = "top center";
    sheet.style.transform = `scale(${scale})`;
    sheet.style.marginBottom = `${(scale - 1) * s.sheet.h}in`;

    const label = document.createElement("div");
    label.className = "sheet-title";
    label.textContent = `Sheet side ${side + 1}`;
    sheet.appendChild(label);

    const startX = (s.sheet.w - grid.cols * grid.w) / 2;
    const startY = (s.sheet.h - grid.rows * grid.h) / 2;

    for (let i = 0; i < perSide; i++) {
      const page = pages[side * perSide + i];
      if (!page) continue;
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const x = startX + col * grid.w;
      const y = startY + row * grid.h;
      sheet.appendChild(pageElement(page, s, x, y, grid.rotate));
      if (hasSpine && !page.isCover && !page.type.includes("cover")) {
        const sigIndex = Math.floor((page.n - 1) / s.signatureSize);
        addSpineGuide(sheet, s, x + .01, y + .02, grid.h - .04, sigIndex, signatureCount);
      }
    }

    addGridGuides(sheet, s, grid, startX, startY);
    preview.appendChild(sheet);
  }
}

function renderReader() {
  const s = readSettings();
  const pages = buildLogicalPages(s);
  const mode = $("readerMode").value;
  readerIndex = Math.max(0, Math.min(readerIndex, pages.length - 1));
  const wrap = $("readerPreview");
  wrap.innerHTML = "";

  const spread = document.createElement("div");
  spread.className = "reader-spread";

  const maxW = Math.min(window.innerWidth - 520, 900);
  const scale = Math.min(4, Math.max(1.2, maxW / ((mode === "spread" ? s.page.w * 2.2 : s.page.w) * 96)));
  spread.style.transform = `scale(${scale})`;

  const pageList = [];
  if (mode === "spread") {
    if (readerIndex === 0) pageList.push(null, pages[0]);
    else pageList.push(pages[readerIndex], pages[readerIndex + 1]);
  } else {
    pageList.push(pages[readerIndex]);
  }

  for (const p of pageList) {
    const shell = document.createElement("div");
    shell.className = "reader-page-shell";
    shell.style.width = `${s.page.w}in`;
    shell.style.height = `${s.page.h}in`;
    if (p) shell.appendChild(pageElement(p, s, 0, 0, false, true));
    spread.appendChild(shell);
  }
  wrap.appendChild(spread);
}

function renderLibrary() {
  const grid = $("libraryGrid");
  grid.innerHTML = library.map(book => `
    <article class="library-card" data-book-id="${book.id}">
      <div class="library-cover" style="background:linear-gradient(to bottom, ${book.coverBg || "#7b1f2a"}, ${book.coverBg2 || "#421117"}); color:${book.coverTextColor || "#fff8e8"};">
        <strong>${escapeHtml(book.title || "Untitled")}</strong>
      </div>
      <div class="library-card-body">
        <h3>${escapeHtml(book.title || "Untitled")}</h3>
        <p>${escapeHtml(book.author || "")}</p>
        <div class="library-card-actions">
          <button data-action="edit">Edit</button>
          <button data-action="view">View</button>
          <button data-action="export">Export</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderAll() {
  if (currentView === "print") renderPrintPreview();
  if (currentView === "reader") renderReader();
  if (currentView === "library") renderLibrary();
  if (currentView === "editor") renderChapterEditor();
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(`${view}View`).classList.add("active");
  renderAll();
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF() {
  switchView("print");
  renderPrintPreview();
  const s = readSettings();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: s.sheet.h >= s.sheet.w ? "portrait" : "landscape",
    unit: "in",
    format: [s.sheet.w, s.sheet.h],
    compress: true,
  });

  const sheets = [...document.querySelectorAll('[data-pdf-page="true"]')];
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const oldTransform = sheet.style.transform;
    const oldMargin = sheet.style.marginBottom;
    sheet.style.transform = "none";
    sheet.style.marginBottom = "0";
    const canvas = await html2canvas(sheet, { scale: 3, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.95);
    if (i > 0) pdf.addPage([s.sheet.w, s.sheet.h]);
    pdf.addImage(img, "JPEG", 0, 0, s.sheet.w, s.sheet.h);
    sheet.style.transform = oldTransform;
    sheet.style.marginBottom = oldMargin;
  }

  const safeTitle = (s.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  pdf.save(`${safeTitle || "tiny-book"}.pdf`);
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data.books)) {
        library = data.books.map(normalizeBook);
        saveLibrary();
        setActiveBook(library[0]);
        switchView("library");
      } else {
        const book = normalizeBook(data);
        book.id = uid();
        library.push(book);
        saveLibrary();
        setActiveBook(book);
        switchView("editor");
      }
    } catch (err) {
      alert("That JSON file could not be imported.");
    }
  };
  reader.readAsText(file);
}

function wireEvents() {
  document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));

  fields().forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (id === "paperPreset") {
        const p = paperPresets[$("paperPreset").value];
        $("pageBg").value = p.bg;
        $("pageTextColor").value = p.text;
      }
      if (id === "pageSize") document.querySelector(".custom-size").hidden = $("pageSize").value !== "custom";
      syncFormToBook();
      if (currentView === "print") renderPrintPreview();
      if (currentView === "reader") renderReader();
      if (currentView === "library") renderLibrary();
    });
  });

  $("coverImage").addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      activeBook.coverImageData = reader.result;
      saveLibrary();
      renderAll();
    };
    reader.readAsDataURL(file);
  });

  $("chaptersEditor").addEventListener("input", e => {
    activeBook.chapters = readChaptersFromEditor();
    saveLibrary();
    if (currentView === "reader") renderReader();
  });

  $("chaptersEditor").addEventListener("change", e => {
    if (!e.target.classList.contains("chapter-image")) return;
    const card = e.target.closest(".chapter-card");
    const id = card.dataset.chapterId;
    const chapter = activeBook.chapters.find(c => c.id === id);
    const file = e.target.files?.[0];
    if (!file || !chapter) return;
    const reader = new FileReader();
    reader.onload = () => {
      chapter.imageData = reader.result;
      saveLibrary();
      renderChapterEditor();
    };
    reader.readAsDataURL(file);
  });

  $("chaptersEditor").addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    activeBook.chapters = readChaptersFromEditor();
    const card = btn.closest(".chapter-card");
    const id = card.dataset.chapterId;
    const idx = activeBook.chapters.findIndex(c => c.id === id);
    if (btn.dataset.action === "remove" && activeBook.chapters.length > 1) activeBook.chapters.splice(idx, 1);
    if (btn.dataset.action === "up" && idx > 0) [activeBook.chapters[idx - 1], activeBook.chapters[idx]] = [activeBook.chapters[idx], activeBook.chapters[idx - 1]];
    if (btn.dataset.action === "down" && idx < activeBook.chapters.length - 1) [activeBook.chapters[idx + 1], activeBook.chapters[idx]] = [activeBook.chapters[idx], activeBook.chapters[idx + 1]];
    saveLibrary();
    renderChapterEditor();
  });

  $("addChapterBtn").addEventListener("click", () => {
    activeBook.chapters = readChaptersFromEditor();
    activeBook.chapters.push({ id: uid(), title: "New Chapter", text: "", imageData: "", imagePlacement: "none", imageWidth: 70 });
    saveLibrary();
    renderChapterEditor();
  });

  $("saveBookBtn").addEventListener("click", () => {
    syncFormToBook();
    alert("Book saved to local library.");
  });

  $("newBookBtn").addEventListener("click", () => {
    const b = normalizeBook({ ...clone(sampleBook), id: uid(), title: "Untitled Tiny Book", chapters: [{ id: uid(), title: "New Chapter", text: "", imageData: "", imagePlacement: "none", imageWidth: 70 }] });
    library.push(b);
    saveLibrary();
    setActiveBook(b);
  });

  $("duplicateBookBtn").addEventListener("click", () => {
    syncFormToBook();
    const b = normalizeBook({ ...clone(activeBook), id: uid(), title: activeBook.title + " Copy" });
    library.push(b);
    saveLibrary();
    setActiveBook(b);
  });

  $("deleteBookBtn").addEventListener("click", () => {
    if (library.length <= 1) return alert("Keep at least one book in the library.");
    if (!confirm("Delete this book from local storage?")) return;
    library = library.filter(b => b.id !== activeBook.id);
    saveLibrary();
    setActiveBook(library[0]);
  });

  $("readerMode").addEventListener("change", renderReader);
  $("prevSpreadBtn").addEventListener("click", () => {
    readerIndex = Math.max(0, readerIndex - ($("readerMode").value === "spread" ? 2 : 1));
    renderReader();
  });
  $("nextSpreadBtn").addEventListener("click", () => {
    readerIndex += $("readerMode").value === "spread" ? 2 : 1;
    renderReader();
  });

  $("libraryGrid").addEventListener("click", e => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const card = btn.closest(".library-card");
    const book = library.find(b => b.id === card.dataset.bookId);
    if (!book) return;
    if (btn.dataset.action === "edit") { setActiveBook(book); switchView("editor"); }
    if (btn.dataset.action === "view") { setActiveBook(book); switchView("reader"); }
    if (btn.dataset.action === "export") downloadJson(`${(book.title || "book").replace(/[^a-z0-9]+/gi, "-")}.json`, book);
  });

  $("exportBookJsonBtn").addEventListener("click", () => {
    syncFormToBook();
    downloadJson(`${(activeBook.title || "book").replace(/[^a-z0-9]+/gi, "-")}.json`, activeBook);
  });
  $("exportLibraryJsonBtn").addEventListener("click", () => downloadJson("tiny-pockets-press-library.json", { books: library }));
  $("exportLibraryBtn").addEventListener("click", () => downloadJson("tiny-pockets-press-library.json", { books: library }));
  $("importJsonInput").addEventListener("change", e => e.target.files?.[0] && importJsonFile(e.target.files[0]));
  $("importLibraryBtn").addEventListener("click", () => $("importJsonInput").click());
  $("exportPdfBtn").addEventListener("click", exportPDF);
  $("printBtn").addEventListener("click", () => { switchView("print"); setTimeout(() => window.print(), 50); });
}

document.addEventListener("DOMContentLoaded", () => {
  populateSelects();
  loadLibrary();
  loadBookIntoForm();
  wireEvents();
  renderAll();
});
