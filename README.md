# Tiny Pockets Press v4

A static browser app for creating tiny printable books, microfiction chapbooks, zines, and miniature folded/sewn booklets.

## Major v4 changes

- Modular JavaScript and CSS files.
- Optional cover fields with title always shown.
- Cover text split mode: title at top, metadata at bottom.
- Cover text outline/stroke and semi-transparent panel.
- Back cover text/image support and option to reuse the front image.
- Blank inside front/back covers with chosen color/texture.
- Separate publication/imprint page inside the book.
- Page numbers: none, centered, or outer-edge, with ornaments before/after.
- Reader spread navigation starts cover-only, then page 2/page 3.
- Style JSON import/export for applying styling to other books.
- Library duplicate asks for a new title, prefilled with “Copy of {title}”.
- Line spacing, paragraph gap, and justified text options.
- Markdown preview, toolbar buttons, and Ctrl/Cmd+B/I/U shortcuts.
- Markdown support for headings, bullet lists, tables, strike, bold, italic, underline via HTML.
- TOC page/chapter numbering, leader dots/line/none, and leader color.
- Separate cover printing mode with overhang and “as many as fit” copies.
- URLs in rendered markdown are converted into QR code blocks.
- Booklet imposition now creates front/back paper sides with leaflet-style ordering.
- Spine guides are simple black edge boxes only.

## Notes

Pagination is still approximate, but it now estimates capacity, inserts soft hyphens into long words, supports CSS hyphenation, and shows progress during PDF export. A future print-shop version should use measured browser layout line-by-line.
