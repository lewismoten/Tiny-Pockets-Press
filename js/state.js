window.TPP = window.TPP || {};
TPP.LIB = "tinyPocketsPressV61";
TPP.ACTIVE = "tinyPocketsPressActiveV61";
TPP.UI = "tinyPocketsPressUiV61";
TPP.library = [];
TPP.active = null;
TPP.view = "editor";
TPP.currentChapter = 0;
TPP.readerIndex = 0;
TPP.lastPages = [];

TPP.clone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};
TPP.esc = function (value) {
  return String(value ?? "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[ch];
  });
};
TPP.norm = function (book) {
  const base = TPP.fallbackBook();
  const out = Object.assign({}, base, book || {});
  out.id = out.id || TPP.uid();
  out.chapters = Array.isArray(out.chapters) && out.chapters.length ? out.chapters : base.chapters;
  out.chapters = out.chapters.map(function (chapter, index) {
    return Object.assign({
      id: TPP.uid(),
      title: "Chapter " + (index + 1),
      text: "",
      imageData: "",
      imagePlacement: "none",
      imageWidth: 70,
      level: 0,
      isSubsection: false,
      isMetadata: false,
      includeInToc: true
    }, chapter);
  });
  return out;
};
TPP.load = async function () {
  try {
    TPP.library = JSON.parse(localStorage.getItem(TPP.LIB) || "[]");
  } catch {
    TPP.library = [];
  }
  if (!TPP.library.length) {
    let sample = null;
    try {
      sample = await fetch("data/sample-book.json").then(function (response) {
        return response.json();
      });
    } catch {
      sample = TPP.fallbackBook();
    }
    TPP.library = [TPP.norm(sample)];
    TPP.save();
  }
  TPP.library = TPP.library.map(TPP.norm);
  const activeId = localStorage.getItem(TPP.ACTIVE);
  TPP.active = TPP.library.find(function (book) { return book.id === activeId; }) || TPP.library[0];
};
TPP.save = function () {
  localStorage.setItem(TPP.LIB, JSON.stringify(TPP.library));
};
TPP.setActive = function (book) {
  TPP.active = book;
  localStorage.setItem(TPP.ACTIVE, book.id);
  TPP.loadForm();
  TPP.renderAll();
};
TPP.download = function (name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = String(name).replace(/[/\\?%*:|"<>]/g, "-");
  link.click();
  URL.revokeObjectURL(url);
};
TPP.showProgress = function (pct, msg) {
  const wrap = document.getElementById("progress");
  const bar = document.getElementById("progressBar");
  const text = document.getElementById("progressText");
  if (!wrap || !bar || !text) return;
  wrap.hidden = false;
  bar.style.width = Math.max(2, Math.min(100, pct)) + "%";
  text.textContent = msg || "Rendering…";
  if (pct >= 100) setTimeout(function () { wrap.hidden = true; }, 800);
};
TPP.file = function (event, callback) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () { callback(reader.result); };
  reader.readAsDataURL(file);
};
