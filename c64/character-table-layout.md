# C64 Charset Layout

Parent pages: [Character Table](character-table.md), [C64 README](README.md)

This page explains how the C64 character set is laid out in memory and how a custom
character set is usually built or replaced.

It focuses on character **slots** and **glyph memory**, because those are the things
that matter most when building or replacing a charset.

Important reminder:

- `PETSCII`, `screen codes`, and `character slots` are related, but not identical
- screen RAM stores screen codes
- the character set provides the `8x8` glyph data for slots `0-255`
- the asset links below come from captured `128x128` sheets for both built-in ROM display sets

## Character Set Format

A normal C64 character set is:

- `256` character slots
- `8` bytes per character
- `2048` bytes total

## Character Cell Size

Each character cell is:

- `8x8` pixels
- `1` bit per pixel

Each character slot uses:

- `8` bytes
- `1` byte per row

## Row Format

Within one glyph:

- byte `0` = top row
- byte `1` = next row
- ...
- byte `7` = bottom row

Within each byte:

- bit `7` = left-most pixel
- bit `0` = right-most pixel

## Character Slot Order

Slots are stored sequentially:

- slot `0` occupies bytes `0-7`
- slot `1` occupies bytes `8-15`
- slot `2` occupies bytes `16-23`
- and so on

Memory formula:

- `glyph address = base + (slot * 8)`

## Alignment And Placement

A character set is normally placed in a contiguous `2 KB` block aligned to a `2 KB`
boundary.

Examples of valid bases:

- `$0000`
- `$0800`
- `$1000`
- `$1800`
- `$2000`
- `$2800`
- `$3000`
- `$3800`

In practice, the VIC must also be able to see the charset in the currently selected VIC
bank.

## Built-In Character ROM

The built-in character ROM is `4 KB`, which contains two `2 KB` character sets:

- unshifted set: uppercase/graphics
- shifted set: upper/lowercase, also called business mode

The visible glyph appearance depends on which built-in set is active.

When people talk about “the C64 character table,” they may mean:

- PETSCII input codes
- screen codes
- character slot numbers
- ROM glyph shapes

This page is mainly about **character slot numbers and glyph memory addresses**.

## Replacing The Character Set

The normal workflow for a custom charset is:

1. copy the built-in character set from ROM into RAM, or start from a blank `2 KB` buffer
2. edit the `8` bytes for any slots you want to change
3. point the VIC at the RAM-based charset

Typical reasons to copy ROM first:

- preserve letters and punctuation
- only customize a few symbols
- use the stock set as a starting point

Typical reasons to start blank:

- fully custom art
- game tiles
- page/image-specific character maps

## How The VIC Uses It

The VIC reads character glyphs using:

- the current VIC bank
- the character-memory pointer setup

That means replacing the charset usually involves:

- placing the `2 KB` charset in RAM inside the active VIC bank
- adjusting the VIC memory-pointer register so the VIC reads from that base

For related addressing details, see:

- [memory-map.md](memory-map.md)
- [notes/banking.md](notes/banking.md)

## Asset Sets

Current captured asset sets:

![unshifted sheet](assets/charset-unshifted/sheet-128.png)

[unshifted sheet](assets/charset-unshifted/sheet-128.png)

![shifted business-mode sheet](assets/charset-shifted-business/sheet-128.png)

[shifted business-mode sheet](assets/charset-shifted-business/sheet-128.png)

## Printable / Label Columns

The slot table uses a practical slot-label approach:

- common text-range characters are named directly
- graphics-heavy ranges are labeled like `GFX 64`
- reverse-video slots are labeled `REV ...`
- when shifted/business mode shows a different visible character, the label is written as `unshifted / shifted`

## Related Docs

- [character-table-slots.md](character-table-slots.md)
- [notes/character-glyphs.md](notes/character-glyphs.md)
- [memory-map.md](memory-map.md)
- [glossary.md](glossary.md)
