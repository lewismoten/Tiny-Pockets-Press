# Tiny Pockets Press v3

A static browser app for making tiny printable books, microfiction collections, zines, and miniature chapbooks.

## Major features

- Finished page sizes down to 0.5 × 0.5 inches.
- Automatically fits as many book pages as possible onto the selected sheet size.
- Rotates pages 90° when that allows more pages per sheet.
- Print-layout view shows the full 8.5 × 11 paper layout with cut/fold guides.
- Reader view supports single-page and two-page spread flipping.
- The settings sidebar is independently scrollable from the workspace.
- Separate editable chapters instead of one giant story textbox.
- Per-chapter images with placement and width controls.
- Markdown support for bold, italic, underline via HTML, strikethrough, and tables.
- Book JSON import/export.
- Whole library JSON import/export.
- Local-storage library with cover cards.
- Paper color presets and texture effects.
- Page background/text colors plus cover gradient options.
- Editable text sizes and colors for cover, title page, TOC, chapter headings, body, and page numbers.
- Spine guides appear as simple black edge boxes only.

## CDN libraries

The app uses these browser-side CDN libraries:

- Marked
- DOMPurify
- html2canvas
- jsPDF

No backend is required.

## Notes

This is still a prototype. It lays pages onto print sheets as a cut-and-stack/grid workflow. Traditional imposed booklet signatures are more complex and would be a future mode.
