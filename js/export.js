window.TPP = window.TPP || {};

TPP.exportPdfFrom = async function (which) {
  TPP.switchView(which);
  if (which === "interior") TPP.renderInterior();
  else TPP.renderCover();

  const settings = TPP.settings();
  const container = which === "interior" ? document.getElementById("interiorPreview") : document.getElementById("coverPreview");
  const pdf = new jspdf.jsPDF({
    orientation: settings.sheet.h >= settings.sheet.w ? "portrait" : "landscape",
    unit: "in",
    format: [settings.sheet.w, settings.sheet.h],
    compress: true
  });
  const sheets = Array.from(container.querySelectorAll("[data-pdf-page]"));
  for (let i = 0; i < sheets.length; i++) {
    TPP.showProgress(5 + Math.round((i / sheets.length) * 90), "Rendering " + which + " PDF page " + (i + 1) + " of " + sheets.length + "…");
    const el = sheets[i];
    const oldTransform = el.style.transform;
    const oldMargin = el.style.marginBottom;
    el.style.transform = "none";
    el.style.marginBottom = "0";
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#fff" });
    if (i) pdf.addPage([settings.sheet.w, settings.sheet.h]);
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, settings.sheet.w, settings.sheet.h);
    el.style.transform = oldTransform;
    el.style.marginBottom = oldMargin;
    await new Promise(requestAnimationFrame);
  }
  const name = (settings.title || "tiny-book").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + which + ".pdf";
  pdf.save(name);
  TPP.showProgress(100, "PDF complete");
};
