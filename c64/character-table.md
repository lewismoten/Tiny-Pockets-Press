# C64 Character Table And Charset Layout

This file explains how the C64 character set is laid out in memory and how a custom character set is usually built or replaced.

It focuses on character **slots** and **glyph memory**, because those are the things that matter most when building or replacing a charset.

Important reminder:

- `PETSCII`, `screen codes`, and `character slots` are related, but not identical
- screen RAM stores screen codes
- the character set provides the 8x8 glyph data for slots `0-255`
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

A character set is normally placed in a contiguous `2 KB` block aligned to a `2 KB` boundary.

Examples of valid bases:

- `$0000`
- `$0800`
- `$1000`
- `$1800`
- `$2000`
- `$2800`
- `$3000`
- `$3800`

In practice, the VIC must also be able to see the charset in the currently selected VIC bank.

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

1. copy the built-in character set from ROM into RAM, or start from a blank 2 KB buffer
2. edit the 8 bytes for any slots you want to change
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

- placing the 2 KB charset in RAM inside the active VIC bank
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

The table below uses a practical slot-label approach:

- common text-range characters are named directly
- graphics-heavy ranges are labeled like `GFX 64`
- reverse-video slots are labeled `REV ...`
- when shifted/business mode shows a different visible character, the label is written as `unshifted / shifted`

| Dec | Hex | Printable / Label | Offset | Unshifted | Shifted / Business |
| --- | --- | --- | --- | --- | --- |
 | 0 | `$00` | @ | `$0000` | ![UG](assets/charset-unshifted/glyphs/PETSCII-00.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-00.PNG) | 
 | 1 | `$01` | A / a | `$0008` | ![UG](assets/charset-unshifted/glyphs/PETSCII-01.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-01.PNG) | 
 | 2 | `$02` | B / b | `$0010` | ![UG](assets/charset-unshifted/glyphs/PETSCII-02.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-02.PNG) | 
 | 3 | `$03` | C / c | `$0018` | ![UG](assets/charset-unshifted/glyphs/PETSCII-03.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-03.PNG) | 
 | 4 | `$04` | D / d | `$0020` | ![UG](assets/charset-unshifted/glyphs/PETSCII-04.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-04.PNG) | 
 | 5 | `$05` | E / e | `$0028` | ![UG](assets/charset-unshifted/glyphs/PETSCII-05.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-05.PNG) | 
 | 6 | `$06` | F / f | `$0030` | ![UG](assets/charset-unshifted/glyphs/PETSCII-06.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-06.PNG) | 
 | 7 | `$07` | G / g | `$0038` | ![UG](assets/charset-unshifted/glyphs/PETSCII-07.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-07.PNG) | 
 | 8 | `$08` | H / h | `$0040` | ![UG](assets/charset-unshifted/glyphs/PETSCII-08.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-08.PNG) | 
 | 9 | `$09` | I / i | `$0048` | ![UG](assets/charset-unshifted/glyphs/PETSCII-09.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-09.PNG) | 
 | 10 | `$0A` | J / j | `$0050` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0A.PNG) | 
 | 11 | `$0B` | K / k | `$0058` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0B.PNG) | 
 | 12 | `$0C` | L / l | `$0060` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0C.PNG) | 
 | 13 | `$0D` | M / m | `$0068` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0D.PNG) | 
 | 14 | `$0E` | N / n | `$0070` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0E.PNG) | 
 | 15 | `$0F` | O / o | `$0078` | ![UG](assets/charset-unshifted/glyphs/PETSCII-0F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-0F.PNG) | 
 | 16 | `$10` | P / p | `$0080` | ![UG](assets/charset-unshifted/glyphs/PETSCII-10.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-10.PNG) | 
 | 17 | `$11` | Q / q | `$0088` | ![UG](assets/charset-unshifted/glyphs/PETSCII-11.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-11.PNG) | 
 | 18 | `$12` | R / r | `$0090` | ![UG](assets/charset-unshifted/glyphs/PETSCII-12.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-12.PNG) | 
 | 19 | `$13` | S / s | `$0098` | ![UG](assets/charset-unshifted/glyphs/PETSCII-13.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-13.PNG) | 
 | 20 | `$14` | T / t | `$00A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-14.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-14.PNG) | 
 | 21 | `$15` | U / u | `$00A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-15.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-15.PNG) | 
 | 22 | `$16` | V / v | `$00B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-16.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-16.PNG) | 
 | 23 | `$17` | W / w | `$00B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-17.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-17.PNG) | 
 | 24 | `$18` | X / x | `$00C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-18.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-18.PNG) | 
 | 25 | `$19` | Y / y | `$00C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-19.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-19.PNG) | 
 | 26 | `$1A` | Z / z | `$00D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1A.PNG) | 
 | 27 | `$1B` | [ | `$00D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1B.PNG) | 
 | 28 | `$1C` | GBP | `$00E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1C.PNG) | 
 | 29 | `$1D` | ] | `$00E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1D.PNG) | 
 | 30 | `$1E` | ^ | `$00F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1E.PNG) | 
 | 31 | `$1F` | LEFT | `$00F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-1F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-1F.PNG) | 
 | 32 | `$20` | SPACE | `$0100` | ![UG](assets/charset-unshifted/glyphs/PETSCII-20.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-20.PNG) | 
 | 33 | `$21` | ! | `$0108` | ![UG](assets/charset-unshifted/glyphs/PETSCII-21.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-21.PNG) | 
 | 34 | `$22` | " | `$0110` | ![UG](assets/charset-unshifted/glyphs/PETSCII-22.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-22.PNG) | 
 | 35 | `$23` | # | `$0118` | ![UG](assets/charset-unshifted/glyphs/PETSCII-23.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-23.PNG) | 
 | 36 | `$24` | $ | `$0120` | ![UG](assets/charset-unshifted/glyphs/PETSCII-24.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-24.PNG) | 
 | 37 | `$25` | % | `$0128` | ![UG](assets/charset-unshifted/glyphs/PETSCII-25.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-25.PNG) | 
 | 38 | `$26` | & | `$0130` | ![UG](assets/charset-unshifted/glyphs/PETSCII-26.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-26.PNG) | 
 | 39 | `$27` | ' | `$0138` | ![UG](assets/charset-unshifted/glyphs/PETSCII-27.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-27.PNG) | 
 | 40 | `$28` | ( | `$0140` | ![UG](assets/charset-unshifted/glyphs/PETSCII-28.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-28.PNG) | 
 | 41 | `$29` | ) | `$0148` | ![UG](assets/charset-unshifted/glyphs/PETSCII-29.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-29.PNG) | 
 | 42 | `$2A` | * | `$0150` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2A.PNG) | 
 | 43 | `$2B` | + | `$0158` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2B.PNG) | 
 | 44 | `$2C` | , | `$0160` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2C.PNG) | 
 | 45 | `$2D` | - | `$0168` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2D.PNG) | 
 | 46 | `$2E` | . | `$0170` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2E.PNG) | 
 | 47 | `$2F` | / | `$0178` | ![UG](assets/charset-unshifted/glyphs/PETSCII-2F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-2F.PNG) | 
 | 48 | `$30` | 0 | `$0180` | ![UG](assets/charset-unshifted/glyphs/PETSCII-30.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-30.PNG) | 
 | 49 | `$31` | 1 | `$0188` | ![UG](assets/charset-unshifted/glyphs/PETSCII-31.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-31.PNG) | 
 | 50 | `$32` | 2 | `$0190` | ![UG](assets/charset-unshifted/glyphs/PETSCII-32.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-32.PNG) | 
 | 51 | `$33` | 3 | `$0198` | ![UG](assets/charset-unshifted/glyphs/PETSCII-33.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-33.PNG) | 
 | 52 | `$34` | 4 | `$01A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-34.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-34.PNG) | 
 | 53 | `$35` | 5 | `$01A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-35.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-35.PNG) | 
 | 54 | `$36` | 6 | `$01B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-36.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-36.PNG) | 
 | 55 | `$37` | 7 | `$01B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-37.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-37.PNG) | 
 | 56 | `$38` | 8 | `$01C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-38.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-38.PNG) | 
 | 57 | `$39` | 9 | `$01C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-39.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-39.PNG) | 
 | 58 | `$3A` | : | `$01D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3A.PNG) | 
 | 59 | `$3B` | ; | `$01D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3B.PNG) | 
 | 60 | `$3C` | < | `$01E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3C.PNG) | 
 | 61 | `$3D` | = | `$01E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3D.PNG) | 
 | 62 | `$3E` | > | `$01F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3E.PNG) | 
 | 63 | `$3F` | ? | `$01F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-3F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-3F.PNG) | 
 | 64 | `$40` | GFX 64 / @ | `$0200` | ![UG](assets/charset-unshifted/glyphs/PETSCII-40.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-40.PNG) | 
 | 65 | `$41` | GFX 65 / A | `$0208` | ![UG](assets/charset-unshifted/glyphs/PETSCII-41.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-41.PNG) | 
 | 66 | `$42` | GFX 66 / B | `$0210` | ![UG](assets/charset-unshifted/glyphs/PETSCII-42.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-42.PNG) | 
 | 67 | `$43` | GFX 67 / C | `$0218` | ![UG](assets/charset-unshifted/glyphs/PETSCII-43.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-43.PNG) | 
 | 68 | `$44` | GFX 68 / D | `$0220` | ![UG](assets/charset-unshifted/glyphs/PETSCII-44.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-44.PNG) | 
 | 69 | `$45` | GFX 69 / E | `$0228` | ![UG](assets/charset-unshifted/glyphs/PETSCII-45.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-45.PNG) | 
 | 70 | `$46` | GFX 70 / F | `$0230` | ![UG](assets/charset-unshifted/glyphs/PETSCII-46.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-46.PNG) | 
 | 71 | `$47` | GFX 71 / G | `$0238` | ![UG](assets/charset-unshifted/glyphs/PETSCII-47.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-47.PNG) | 
 | 72 | `$48` | GFX 72 / H | `$0240` | ![UG](assets/charset-unshifted/glyphs/PETSCII-48.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-48.PNG) | 
 | 73 | `$49` | GFX 73 / I | `$0248` | ![UG](assets/charset-unshifted/glyphs/PETSCII-49.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-49.PNG) | 
 | 74 | `$4A` | GFX 74 / J | `$0250` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4A.PNG) | 
 | 75 | `$4B` | GFX 75 / K | `$0258` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4B.PNG) | 
 | 76 | `$4C` | GFX 76 / L | `$0260` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4C.PNG) | 
 | 77 | `$4D` | GFX 77 / M | `$0268` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4D.PNG) | 
 | 78 | `$4E` | GFX 78 / N | `$0270` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4E.PNG) | 
 | 79 | `$4F` | GFX 79 / O | `$0278` | ![UG](assets/charset-unshifted/glyphs/PETSCII-4F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-4F.PNG) | 
 | 80 | `$50` | GFX 80 / P | `$0280` | ![UG](assets/charset-unshifted/glyphs/PETSCII-50.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-50.PNG) | 
 | 81 | `$51` | GFX 81 / Q | `$0288` | ![UG](assets/charset-unshifted/glyphs/PETSCII-51.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-51.PNG) | 
 | 82 | `$52` | GFX 82 / R | `$0290` | ![UG](assets/charset-unshifted/glyphs/PETSCII-52.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-52.PNG) | 
 | 83 | `$53` | GFX 83 / S | `$0298` | ![UG](assets/charset-unshifted/glyphs/PETSCII-53.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-53.PNG) | 
 | 84 | `$54` | GFX 84 / T | `$02A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-54.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-54.PNG) | 
 | 85 | `$55` | GFX 85 / U | `$02A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-55.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-55.PNG) | 
 | 86 | `$56` | GFX 86 / V | `$02B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-56.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-56.PNG) | 
 | 87 | `$57` | GFX 87 / W | `$02B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-57.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-57.PNG) | 
 | 88 | `$58` | GFX 88 / X | `$02C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-58.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-58.PNG) | 
 | 89 | `$59` | GFX 89 / Y | `$02C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-59.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-59.PNG) | 
 | 90 | `$5A` | GFX 90 / Z | `$02D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5A.PNG) | 
 | 91 | `$5B` | GFX 91 / [ | `$02D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5B.PNG) | 
 | 92 | `$5C` | GFX 92 / GBP | `$02E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5C.PNG) | 
 | 93 | `$5D` | GFX 93 / ] | `$02E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5D.PNG) | 
 | 94 | `$5E` | GFX 94 / ^ | `$02F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5E.PNG) | 
 | 95 | `$5F` | GFX 95 / LEFT | `$02F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-5F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-5F.PNG) | 
 | 96 | `$60` | GFX 96 | `$0300` | ![UG](assets/charset-unshifted/glyphs/PETSCII-60.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-60.PNG) | 
 | 97 | `$61` | GFX 97 | `$0308` | ![UG](assets/charset-unshifted/glyphs/PETSCII-61.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-61.PNG) | 
 | 98 | `$62` | GFX 98 | `$0310` | ![UG](assets/charset-unshifted/glyphs/PETSCII-62.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-62.PNG) | 
 | 99 | `$63` | GFX 99 | `$0318` | ![UG](assets/charset-unshifted/glyphs/PETSCII-63.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-63.PNG) | 
 | 100 | `$64` | GFX 100 | `$0320` | ![UG](assets/charset-unshifted/glyphs/PETSCII-64.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-64.PNG) | 
 | 101 | `$65` | GFX 101 | `$0328` | ![UG](assets/charset-unshifted/glyphs/PETSCII-65.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-65.PNG) | 
 | 102 | `$66` | GFX 102 | `$0330` | ![UG](assets/charset-unshifted/glyphs/PETSCII-66.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-66.PNG) | 
 | 103 | `$67` | GFX 103 | `$0338` | ![UG](assets/charset-unshifted/glyphs/PETSCII-67.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-67.PNG) | 
 | 104 | `$68` | GFX 104 | `$0340` | ![UG](assets/charset-unshifted/glyphs/PETSCII-68.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-68.PNG) | 
 | 105 | `$69` | GFX 105 | `$0348` | ![UG](assets/charset-unshifted/glyphs/PETSCII-69.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-69.PNG) | 
 | 106 | `$6A` | GFX 106 | `$0350` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6A.PNG) | 
 | 107 | `$6B` | GFX 107 | `$0358` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6B.PNG) | 
 | 108 | `$6C` | GFX 108 | `$0360` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6C.PNG) | 
 | 109 | `$6D` | GFX 109 | `$0368` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6D.PNG) | 
 | 110 | `$6E` | GFX 110 | `$0370` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6E.PNG) | 
 | 111 | `$6F` | GFX 111 | `$0378` | ![UG](assets/charset-unshifted/glyphs/PETSCII-6F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-6F.PNG) | 
 | 112 | `$70` | GFX 112 | `$0380` | ![UG](assets/charset-unshifted/glyphs/PETSCII-70.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-70.PNG) | 
 | 113 | `$71` | GFX 113 | `$0388` | ![UG](assets/charset-unshifted/glyphs/PETSCII-71.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-71.PNG) | 
 | 114 | `$72` | GFX 114 | `$0390` | ![UG](assets/charset-unshifted/glyphs/PETSCII-72.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-72.PNG) | 
 | 115 | `$73` | GFX 115 | `$0398` | ![UG](assets/charset-unshifted/glyphs/PETSCII-73.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-73.PNG) | 
 | 116 | `$74` | GFX 116 | `$03A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-74.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-74.PNG) | 
 | 117 | `$75` | GFX 117 | `$03A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-75.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-75.PNG) | 
 | 118 | `$76` | GFX 118 | `$03B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-76.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-76.PNG) | 
 | 119 | `$77` | GFX 119 | `$03B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-77.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-77.PNG) | 
 | 120 | `$78` | GFX 120 | `$03C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-78.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-78.PNG) | 
 | 121 | `$79` | GFX 121 | `$03C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-79.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-79.PNG) | 
 | 122 | `$7A` | GFX 122 | `$03D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7A.PNG) | 
 | 123 | `$7B` | GFX 123 | `$03D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7B.PNG) | 
 | 124 | `$7C` | GFX 124 | `$03E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7C.PNG) | 
 | 125 | `$7D` | GFX 125 | `$03E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7D.PNG) | 
 | 126 | `$7E` | GFX 126 | `$03F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7E.PNG) | 
 | 127 | `$7F` | GFX 127 | `$03F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-7F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-7F.PNG) | 
 | 128 | `$80` | REV @ | `$0400` | ![UG](assets/charset-unshifted/glyphs/PETSCII-80.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-80.PNG) | 
 | 129 | `$81` | REV A / REV a | `$0408` | ![UG](assets/charset-unshifted/glyphs/PETSCII-81.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-81.PNG) | 
 | 130 | `$82` | REV B / REV b | `$0410` | ![UG](assets/charset-unshifted/glyphs/PETSCII-82.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-82.PNG) | 
 | 131 | `$83` | REV C / REV c | `$0418` | ![UG](assets/charset-unshifted/glyphs/PETSCII-83.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-83.PNG) | 
 | 132 | `$84` | REV D / REV d | `$0420` | ![UG](assets/charset-unshifted/glyphs/PETSCII-84.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-84.PNG) | 
 | 133 | `$85` | REV E / REV e | `$0428` | ![UG](assets/charset-unshifted/glyphs/PETSCII-85.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-85.PNG) | 
 | 134 | `$86` | REV F / REV f | `$0430` | ![UG](assets/charset-unshifted/glyphs/PETSCII-86.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-86.PNG) | 
 | 135 | `$87` | REV G / REV g | `$0438` | ![UG](assets/charset-unshifted/glyphs/PETSCII-87.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-87.PNG) | 
 | 136 | `$88` | REV H / REV h | `$0440` | ![UG](assets/charset-unshifted/glyphs/PETSCII-88.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-88.PNG) | 
 | 137 | `$89` | REV I / REV i | `$0448` | ![UG](assets/charset-unshifted/glyphs/PETSCII-89.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-89.PNG) | 
 | 138 | `$8A` | REV J / REV j | `$0450` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8A.PNG) | 
 | 139 | `$8B` | REV K / REV k | `$0458` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8B.PNG) | 
 | 140 | `$8C` | REV L / REV l | `$0460` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8C.PNG) | 
 | 141 | `$8D` | REV M / REV m | `$0468` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8D.PNG) | 
 | 142 | `$8E` | REV N / REV n | `$0470` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8E.PNG) | 
 | 143 | `$8F` | REV O / REV o | `$0478` | ![UG](assets/charset-unshifted/glyphs/PETSCII-8F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-8F.PNG) | 
 | 144 | `$90` | REV P / REV p | `$0480` | ![UG](assets/charset-unshifted/glyphs/PETSCII-90.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-90.PNG) | 
 | 145 | `$91` | REV Q / REV q | `$0488` | ![UG](assets/charset-unshifted/glyphs/PETSCII-91.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-91.PNG) | 
 | 146 | `$92` | REV R / REV r | `$0490` | ![UG](assets/charset-unshifted/glyphs/PETSCII-92.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-92.PNG) | 
 | 147 | `$93` | REV S / REV s | `$0498` | ![UG](assets/charset-unshifted/glyphs/PETSCII-93.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-93.PNG) | 
 | 148 | `$94` | REV T / REV t | `$04A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-94.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-94.PNG) | 
 | 149 | `$95` | REV U / REV u | `$04A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-95.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-95.PNG) | 
 | 150 | `$96` | REV V / REV v | `$04B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-96.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-96.PNG) | 
 | 151 | `$97` | REV W / REV w | `$04B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-97.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-97.PNG) | 
 | 152 | `$98` | REV X / REV x | `$04C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-98.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-98.PNG) | 
 | 153 | `$99` | REV Y / REV y | `$04C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-99.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-99.PNG) | 
 | 154 | `$9A` | REV Z / REV z | `$04D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9A.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9A.PNG) | 
 | 155 | `$9B` | REV [ | `$04D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9B.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9B.PNG) | 
 | 156 | `$9C` | REV GBP | `$04E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9C.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9C.PNG) | 
 | 157 | `$9D` | REV ] | `$04E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9D.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9D.PNG) | 
 | 158 | `$9E` | REV ^ | `$04F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9E.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9E.PNG) | 
 | 159 | `$9F` | REV LEFT | `$04F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-9F.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-9F.PNG) | 
 | 160 | `$A0` | REV SPACE | `$0500` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A0.PNG) | 
 | 161 | `$A1` | REV ! | `$0508` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A1.PNG) | 
 | 162 | `$A2` | REV " | `$0510` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A2.PNG) | 
 | 163 | `$A3` | REV # | `$0518` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A3.PNG) | 
 | 164 | `$A4` | REV $ | `$0520` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A4.PNG) | 
 | 165 | `$A5` | REV % | `$0528` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A5.PNG) | 
 | 166 | `$A6` | REV & | `$0530` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A6.PNG) | 
 | 167 | `$A7` | REV ' | `$0538` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A7.PNG) | 
 | 168 | `$A8` | REV ( | `$0540` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A8.PNG) | 
 | 169 | `$A9` | REV ) | `$0548` | ![UG](assets/charset-unshifted/glyphs/PETSCII-A9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-A9.PNG) | 
 | 170 | `$AA` | REV * | `$0550` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AA.PNG) | 
 | 171 | `$AB` | REV + | `$0558` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AB.PNG) | 
 | 172 | `$AC` | REV , | `$0560` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AC.PNG) | 
 | 173 | `$AD` | REV - | `$0568` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AD.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AD.PNG) | 
 | 174 | `$AE` | REV . | `$0570` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AE.PNG) | 
 | 175 | `$AF` | REV / | `$0578` | ![UG](assets/charset-unshifted/glyphs/PETSCII-AF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-AF.PNG) | 
 | 176 | `$B0` | REV 0 | `$0580` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B0.PNG) | 
 | 177 | `$B1` | REV 1 | `$0588` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B1.PNG) | 
 | 178 | `$B2` | REV 2 | `$0590` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B2.PNG) | 
 | 179 | `$B3` | REV 3 | `$0598` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B3.PNG) | 
 | 180 | `$B4` | REV 4 | `$05A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B4.PNG) | 
 | 181 | `$B5` | REV 5 | `$05A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B5.PNG) | 
 | 182 | `$B6` | REV 6 | `$05B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B6.PNG) | 
 | 183 | `$B7` | REV 7 | `$05B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B7.PNG) | 
 | 184 | `$B8` | REV 8 | `$05C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B8.PNG) | 
 | 185 | `$B9` | REV 9 | `$05C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-B9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-B9.PNG) | 
 | 186 | `$BA` | REV : | `$05D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BA.PNG) | 
 | 187 | `$BB` | REV ; | `$05D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BB.PNG) | 
 | 188 | `$BC` | REV < | `$05E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BC.PNG) | 
 | 189 | `$BD` | REV = | `$05E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BD.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BD.PNG) | 
 | 190 | `$BE` | REV > | `$05F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BE.PNG) | 
 | 191 | `$BF` | REV ? | `$05F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-BF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-BF.PNG) | 
 | 192 | `$C0` | REV GFX 64 / REV @ | `$0600` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C0.PNG) | 
 | 193 | `$C1` | REV GFX 65 / REV A | `$0608` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C1.PNG) | 
 | 194 | `$C2` | REV GFX 66 / REV B | `$0610` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C2.PNG) | 
 | 195 | `$C3` | REV GFX 67 / REV C | `$0618` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C3.PNG) | 
 | 196 | `$C4` | REV GFX 68 / REV D | `$0620` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C4.PNG) | 
 | 197 | `$C5` | REV GFX 69 / REV E | `$0628` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C5.PNG) | 
 | 198 | `$C6` | REV GFX 70 / REV F | `$0630` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C6.PNG) | 
 | 199 | `$C7` | REV GFX 71 / REV G | `$0638` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C7.PNG) | 
 | 200 | `$C8` | REV GFX 72 / REV H | `$0640` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C8.PNG) | 
 | 201 | `$C9` | REV GFX 73 / REV I | `$0648` | ![UG](assets/charset-unshifted/glyphs/PETSCII-C9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-C9.PNG) | 
 | 202 | `$CA` | REV GFX 74 / REV J | `$0650` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CA.PNG) | 
 | 203 | `$CB` | REV GFX 75 / REV K | `$0658` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CB.PNG) | 
 | 204 | `$CC` | REV GFX 76 / REV L | `$0660` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CC.PNG) | 
 | 205 | `$CD` | REV GFX 77 / REV M | `$0668` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CD.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CD.PNG) | 
 | 206 | `$CE` | REV GFX 78 / REV N | `$0670` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CE.PNG) | 
 | 207 | `$CF` | REV GFX 79 / REV O | `$0678` | ![UG](assets/charset-unshifted/glyphs/PETSCII-CF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-CF.PNG) | 
 | 208 | `$D0` | REV GFX 80 / REV P | `$0680` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D0.PNG) | 
 | 209 | `$D1` | REV GFX 81 / REV Q | `$0688` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D1.PNG) | 
 | 210 | `$D2` | REV GFX 82 / REV R | `$0690` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D2.PNG) | 
 | 211 | `$D3` | REV GFX 83 / REV S | `$0698` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D3.PNG) | 
 | 212 | `$D4` | REV GFX 84 / REV T | `$06A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D4.PNG) | 
 | 213 | `$D5` | REV GFX 85 / REV U | `$06A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D5.PNG) | 
 | 214 | `$D6` | REV GFX 86 / REV V | `$06B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D6.PNG) | 
 | 215 | `$D7` | REV GFX 87 / REV W | `$06B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D7.PNG) | 
 | 216 | `$D8` | REV GFX 88 / REV X | `$06C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D8.PNG) | 
 | 217 | `$D9` | REV GFX 89 / REV Y | `$06C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-D9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-D9.PNG) | 
 | 218 | `$DA` | REV GFX 90 / REV Z | `$06D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DA.PNG) | 
 | 219 | `$DB` | REV GFX 91 / REV [ | `$06D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DB.PNG) | 
 | 220 | `$DC` | REV GFX 92 / REV GBP | `$06E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DC.PNG) | 
 | 221 | `$DD` | REV GFX 93 / REV ] | `$06E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DD.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DD.PNG) | 
 | 222 | `$DE` | REV GFX 94 / REV ^ | `$06F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DE.PNG) | 
 | 223 | `$DF` | REV GFX 95 / REV LEFT | `$06F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-DF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-DF.PNG) | 
 | 224 | `$E0` | REV GFX 96 | `$0700` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E0.PNG) | 
 | 225 | `$E1` | REV GFX 97 | `$0708` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E1.PNG) | 
 | 226 | `$E2` | REV GFX 98 | `$0710` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E2.PNG) | 
 | 227 | `$E3` | REV GFX 99 | `$0718` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E3.PNG) | 
 | 228 | `$E4` | REV GFX 100 | `$0720` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E4.PNG) | 
 | 229 | `$E5` | REV GFX 101 | `$0728` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E5.PNG) | 
 | 230 | `$E6` | REV GFX 102 | `$0730` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E6.PNG) | 
 | 231 | `$E7` | REV GFX 103 | `$0738` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E7.PNG) | 
 | 232 | `$E8` | REV GFX 104 | `$0740` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E8.PNG) | 
 | 233 | `$E9` | REV GFX 105 | `$0748` | ![UG](assets/charset-unshifted/glyphs/PETSCII-E9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-E9.PNG) | 
 | 234 | `$EA` | REV GFX 106 | `$0750` | ![UG](assets/charset-unshifted/glyphs/PETSCII-EA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-EA.PNG) | 
 | 235 | `$EB` | REV GFX 107 | `$0758` | ![UG](assets/charset-unshifted/glyphs/PETSCII-EB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-EB.PNG) | 
 | 236 | `$EC` | REV GFX 108 | `$0760` | ![UG](assets/charset-unshifted/glyphs/PETSCII-EC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-EC.PNG) | 
 | 237 | `$ED` | REV GFX 109 | `$0768` | ![UG](assets/charset-unshifted/glyphs/PETSCII-ED.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-ED.PNG) | 
 | 238 | `$EE` | REV GFX 110 | `$0770` | ![UG](assets/charset-unshifted/glyphs/PETSCII-EE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-EE.PNG) | 
 | 239 | `$EF` | REV GFX 111 | `$0778` | ![UG](assets/charset-unshifted/glyphs/PETSCII-EF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-EF.PNG) | 
 | 240 | `$F0` | REV GFX 112 | `$0780` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F0.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F0.PNG) | 
 | 241 | `$F1` | REV GFX 113 | `$0788` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F1.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F1.PNG) | 
 | 242 | `$F2` | REV GFX 114 | `$0790` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F2.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F2.PNG) | 
 | 243 | `$F3` | REV GFX 115 | `$0798` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F3.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F3.PNG) | 
 | 244 | `$F4` | REV GFX 116 | `$07A0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F4.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F4.PNG) | 
 | 245 | `$F5` | REV GFX 117 | `$07A8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F5.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F5.PNG) | 
 | 246 | `$F6` | REV GFX 118 | `$07B0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F6.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F6.PNG) | 
 | 247 | `$F7` | REV GFX 119 | `$07B8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F7.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F7.PNG) | 
 | 248 | `$F8` | REV GFX 120 | `$07C0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F8.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F8.PNG) | 
 | 249 | `$F9` | REV GFX 121 | `$07C8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-F9.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-F9.PNG) | 
 | 250 | `$FA` | REV GFX 122 | `$07D0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FA.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FA.PNG) | 
 | 251 | `$FB` | REV GFX 123 | `$07D8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FB.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FB.PNG) | 
 | 252 | `$FC` | REV GFX 124 | `$07E0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FC.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FC.PNG) | 
 | 253 | `$FD` | REV GFX 125 | `$07E8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FD.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FD.PNG) | 
 | 254 | `$FE` | REV GFX 126 | `$07F0` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FE.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FE.PNG) | 
 | 255 | `$FF` | REV GFX 127 | `$07F8` | ![UG](assets/charset-unshifted/glyphs/PETSCII-FF.PNG) | ![LU](assets/charset-shifted-business/glyphs/PETSCII-FF.PNG) | 

## Related Docs

- [notes/character-glyphs.md](notes/character-glyphs.md)
- [memory-map.md](memory-map.md)
- [glossary.md](glossary.md)
