window.TPP = window.TPP || {};

TPP.dateTime = function (value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};
TPP.bookDimensions = function (book) {
  const size = TPP.sizes[book.pageSize] || { w: book.customW || 1, h: book.customH || 1 };
  return {
    w: Number(size.w) || 1,
    h: Number(size.h) || 1
  };
};
TPP.aboutMetaItem = function (label, value) {
  return '<div class="about-meta-item"><span class="about-meta-label">' + TPP.esc(label) + '</span><span class="about-meta-value">' + TPP.esc(value || "—") + "</span></div>";
};
TPP.bookLatestSource = function (book) {
  const chain = Array.isArray(book && book.provenance) ? book.provenance : [];
  for (let i = chain.length - 1; i >= 0; i--) {
    if (chain[i] && (chain[i].action === "import" || chain[i].action === "copy")) return chain[i];
  }
  return null;
};
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
      '<div class="library-card-body"><h3>' + TPP.esc(book.title) + "</h3><p>" + TPP.esc(book.author) + "</p><p>" + pages + " pages · " + Number(size.w).toFixed(2) + "×" + Number(size.h).toFixed(2) + ' in</p><div class="toolbar"><button data-act="edit">Edit</button><button data-act="about">About</button><button data-act="view">View</button><button data-act="dup">Duplicate</button><button data-act="export">Export</button></div></div></article>';
  }).join("");
};
TPP.renderAbout = function () {
  if (!TPP.active) return;
  const book = TPP.active;
  const pages = TPP.buildPages();
  const settings = TPP.settings();
  const front = pages.find(function (page) { return page.role === "front"; }) || pages[0];
  const size = TPP.bookDimensions(book);
  const latest = TPP.bookLatestSource(book);
  const latestRevisionLabel = latest ? (String(latest.sourceRevision || 1) + "." + String(latest.sourceSubrevision || 0)) : "";
  const original = latest ? TPP.library.find(function (candidate) { return candidate.id === latest.sourceId; }) : null;
  const summary = document.getElementById("aboutSummary");
  const panel = document.getElementById("aboutPanel");
  if (!summary || !panel) return;
  const revisionLabel = String(book.revision || 1) + "." + String(book.subrevision || 0);
  summary.innerHTML = "<strong>Revision " + TPP.esc(revisionLabel) + "</strong>. " +
    TPP.esc(String(pages.length)) + " pages at " + TPP.esc(size.w.toFixed(2) + " × " + size.h.toFixed(2)) + " in. " +
    (latest ? ("Latest source: " + TPP.esc((latest.action === "import" ? "Imported" : "Copied") + " from revision " + latestRevisionLabel + ".")) : "No copy/import provenance recorded.");
  panel.innerHTML =
    '<div>' +
      '<article class="about-card">' +
        '<h3>Cover</h3>' +
        '<div class="about-cover-shell"><div id="aboutCoverMount"></div></div>' +
        '<p class="about-note">ID: ' + TPP.esc(book.id) + "</p>" +
      "</article>" +
    "</div>" +
    '<div>' +
      '<article class="about-meta">' +
        '<h3>Metadata</h3>' +
        '<div class="about-meta-grid">' +
          [
            TPP.aboutMetaItem("Title", book.title),
            TPP.aboutMetaItem("Author", book.author),
            TPP.aboutMetaItem("Author Spine Name", book.spineAuthor),
            TPP.aboutMetaItem("Publishing Date", TPP.date(book.pubDate)),
            TPP.aboutMetaItem("Publisher", book.publisher),
            TPP.aboutMetaItem("Copyright", book.copyright),
            TPP.aboutMetaItem("Series", book.seriesName),
            TPP.aboutMetaItem("Number", book.number),
            TPP.aboutMetaItem("Volume", book.volume),
            TPP.aboutMetaItem("Printing", book.printing),
            TPP.aboutMetaItem("Include TOC", book.includeToc ? "Yes" : "No"),
            TPP.aboutMetaItem("Pages", String(pages.length)),
            TPP.aboutMetaItem("Dimensions", size.w.toFixed(2) + " × " + size.h.toFixed(2) + " in"),
            TPP.aboutMetaItem("Book ID", book.id),
            TPP.aboutMetaItem("Revision", String(book.revision || 1)),
            TPP.aboutMetaItem("Subrevision", String(book.subrevision || 0)),
            TPP.aboutMetaItem("Created", TPP.dateTime(book.createdAt)),
            TPP.aboutMetaItem("Last Edited", TPP.dateTime(book.updatedAt)),
            TPP.aboutMetaItem("Last Imported", TPP.dateTime(book.lastImportedAt)),
            TPP.aboutMetaItem("Last Exported", TPP.dateTime(book.lastExportedAt))
          ].join("") +
        "</div>" +
      "</article>" +
      '<article class="about-provenance">' +
        '<h3>Latest Copy / Import</h3>' +
        (latest
          ? (
            '<div class="about-meta-grid">' +
              TPP.aboutMetaItem("Action", latest.action === "import" ? "Imported" : "Copied") +
              TPP.aboutMetaItem("Original ID", latest.sourceId) +
              TPP.aboutMetaItem("Original Title", latest.sourceTitle) +
              TPP.aboutMetaItem("Original Revision", String(latest.sourceRevision || 1)) +
              TPP.aboutMetaItem("Original Subrevision", String(latest.sourceSubrevision || 0)) +
              TPP.aboutMetaItem("Original Updated", TPP.dateTime(latest.sourceUpdatedAt)) +
              TPP.aboutMetaItem("Recorded", TPP.dateTime(latest.recordedAt)) +
            "</div>" +
            (original
              ? '<button type="button" id="aboutOpenOriginal" class="about-link">Open Original Book</button>'
              : '<p class="about-note">Original book is not currently in this library.</p>')
          )
          : '<p class="about-note">This book does not have any copy/import provenance yet.</p>') +
      "</article>" +
    "</div>";
  const originalButton = document.getElementById("aboutOpenOriginal");
  if (originalButton && original) {
    originalButton.onclick = function () {
      TPP.setActive(original);
      TPP.switchView("about");
    };
  }
  const coverMount = document.getElementById("aboutCoverMount");
  if (coverMount && front) {
    coverMount.innerHTML = "";
    const coverEl = TPP.pageEl(front, settings, 0, 0, false, true, { w: settings.page.w, h: settings.page.h });
    coverEl.style.position = "relative";
    coverEl.style.left = "auto";
    coverEl.style.top = "auto";
    coverEl.style.boxShadow = "0 18px 35px rgb(0 0 0 / .18)";
    coverEl.style.borderRadius = ".18in";
    coverMount.appendChild(coverEl);
  }
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
