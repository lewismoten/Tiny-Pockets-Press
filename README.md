# Tiny Book Maker

A small static HTML/CSS/JavaScript project for creating printable tiny books from pasted story text.

## Features

- Paste story text, author, title, publishing date, publisher, series name, and series number.
- Choose finished page size, sheet size, margins, font, font size, and page numbers.
- Upload a cover image and adjust its position and zoom.
- Optional framed cover border.
- Automatic booklet page ordering for double-sided sheets.
- Stapled booklet mode for short books.
- Sewn-signature mode for longer books, including:
  - estimated spine width based on page count and paper thickness,
  - spine color matching the cover background,
  - signature group marks along the binding edge.
- Client-side PDF export using CDN copies of `html2canvas` and `jsPDF`.

## Files

- `index.html`
- `styles.css`
- `app.js`

## How to use

Open `index.html` in a browser, paste a story, adjust settings, then choose **Export PDF**.

For best results, print the exported PDF double-sided with “flip on short edge” or “flip on long edge” depending on your printer and selected layout. Test with a short dummy book first.

## Notes

This is a starter project. Browser pagination is approximate because line wrapping varies by font and device. For polished production, the next improvement would be a true measuring/pagination engine that fills pages based on actual rendered text height.
