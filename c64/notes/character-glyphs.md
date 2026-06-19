# Screen Codes, PETSCII, And Glyph Notes

Parent pages: [Notes Index](README.md), [Character Table](../character-table.md), [C64 README](../README.md)

## Terminology Reminder

- PETSCII: Commodore character encoding used for typed and stored text.
- screen codes: what screen RAM uses to select displayed characters.
- character ROM/glyphs: the bitmap patterns for those characters.

These are related, but not identical.

For the memory layout of a 256-slot character set, replacement strategy, and a slot/address table, see [../character-table.md](../character-table.md).

## Why This Matters Here

This project uses:

- BASIC text screens for menus and metadata
- sprite-generated lettering for bitmap overlays such as `PRESS ANY KEY`
- standard bitmap graphics for cover/page images

That means text can come from three different systems:

1. normal screen codes in text mode
2. sprite-built custom letter masks
3. bitmap art baked directly into image data

## Useful Reminders

- unshifted mode shows the uppercase/graphics set
- shifted mode shows the upper/lowercase set and is also called business mode
- `PRINT` writes PETSCII, which the ROM converts to screen codes
- directly writing to screen RAM uses screen codes, not raw PETSCII expectations
- reverse-video and control codes can appear as unexpected symbols if mixed into text data

## Project Advice

- store user-facing metadata as clean plain text without control characters
- terminate raw text payloads with `0x00` when designing simple custom formats
- keep sprite text assets separate from image payloads when they need reuse
- prefer generated bitmap/sprite glyph data over relying on ROM text when exact placement matters

## Related Notes

- [../character-table.md](../character-table.md)
- [../character-table-layout.md](../character-table-layout.md)
- [basic-v2.md](basic-v2.md)
