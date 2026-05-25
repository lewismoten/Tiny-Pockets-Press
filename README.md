# Tiny Pockets Press

A static HTML/CSS/JavaScript app for creating printable tiny books, microfiction chapbooks, zines, and miniature folded booklets.

## What changed in this version

- Supports very small custom page sizes, down to around 1 × 1 inch.
- Includes a Letter 4×4 grid preset: 2.125 × 2.75 inch finished pages.
- Removes physical sheet borders from print output.
- Adds cut guides and fold guides.
- Prevents sewn-signature alignment marks from appearing on the cover/spine sheet.
- Adds chapter/story support.
- Adds optional table of contents.
- Adds publisher, copyright, printing, volume, number, and series metadata.
- Reusable settings are saved in `localStorage`, while story/title stay fresh.
- Includes the default sample story: “Santa’s Little OSHA Violation.”

## Chapter format

Separate stories or chapters with a line containing three dashes:

```text
First Story Title

Story text...

---

Second Story Title

Story text...
```

## Printing

Export to PDF or print directly. For double-sided booklet tests, try a small sample first and confirm your printer’s flip direction.

## Files

- `index.html`
- `styles.css`
- `app.js`
