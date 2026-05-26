window.TPP = window.TPP || {};

TPP.bookText = function (book) {
  return [book.title, book.author, book.publisher].concat((book.chapters || []).flatMap(function (c) {
    return [c.title, c.text];
  })).join(" ").toLowerCase();
};
TPP.renderLibrary = function () {
  const q = (document.getElementById("librarySearch")?.value || "").toLowerCase();
  const books = TPP.library.filter(function (book) {
    return !q || TPP.bookText(book).includes(q);
  });
  document.getElementById("libraryGrid").innerHTML = books.map(function (book) {
    const size = TPP.sizes[book.pageSize] || { w: book.customW || 1, h: book.customH || 1 };
    const pages = book._pageCount || "—";
    return '<article class="library-card" data-id="' + book.id + '">' +
      '<div class="library-cover" style="' + (book.coverPreview ? "background-image:url(" + book.coverPreview + ")" : "background:linear-gradient(to bottom," + book.coverBg1 + "," + book.coverBg2 + ")") + '"></div>' +
      '<div class="library-card-body"><h3>' + TPP.esc(book.title) + "</h3><p>" + TPP.esc(book.author) + "</p><p>" + pages + " pages · " + Number(size.w).toFixed(2) + "×" + Number(size.h).toFixed(2) + ' in</p><div class="toolbar"><button data-act="edit">Edit</button><button data-act="view">View</button><button data-act="dup">Duplicate</button><button data-act="export">Export</button></div></div></article>';
  }).join("");
};
TPP.captureCover = async function () {
  try {
    const settings = TPP.settings();
    const page = TPP.buildPages()[0];
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:" + settings.page.w + "in;height:" + settings.page.h + "in";
    wrap.appendChild(TPP.pageEl(page, settings, 0, 0, false, true));
    document.body.appendChild(wrap);
    const canvas = await html2canvas(wrap, { scale: 4, backgroundColor: null });
    TPP.active.coverPreview = canvas.toDataURL("image/jpeg", 0.9);
    TPP.active._pageCount = TPP.lastPages.length;
    wrap.remove();
    TPP.save();
  } catch (error) {
    console.warn(error);
  }
};
