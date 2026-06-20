# C64 Colors And Color Encoding

This file explains how color values are represented in the C64-related docs for this project.

Parent: [C64 README](README.md)

It covers:

- bits, nibbles, and bytes
- C64 color indices
- color RAM
- screen RAM color pairs in bitmap mode
- the order in which cell color data is laid out

## Bits, Nibbles, And Bytes

When talking about color values, it helps to picture a byte like this:

```text
[FFFFBBBB]
```

- `FFFF` = upper nibble = bits `7-4`
- `BBBB` = lower nibble = bits `3-0`

Another way to visualize the same byte is:

```text
76543210
^      ^
MSB    LSB
```

- `MSB` = most significant bit = bit `7`
- `LSB` = least significant bit = bit `0`

If a byte were:

```text
10100011
```

then:

- upper nibble = `1010` = decimal `10`
- lower nibble = `0011` = decimal `3`

## C64 Color Values

The standard 16-color C64 palette uses a 4-bit color index:

| Bits | Decimal | Hex | Name | HTML hex |
| --- | --- | --- | --- | --- |
| `0000` | `0` | `$0` | black | `#000000` |
| `0001` | `1` | `$1` | white | `#ffffff` |
| `0010` | `2` | `$2` | red | `#813338` |
| `0011` | `3` | `$3` | cyan | `#75cec8` |
| `0100` | `4` | `$4` | purple | `#8e3c97` |
| `0101` | `5` | `$5` | green | `#56ac4d` |
| `0110` | `6` | `$6` | blue | `#2e2c9b` |
| `0111` | `7` | `$7` | yellow | `#edf171` |
| `1000` | `8` | `$8` | orange | `#8e5029` |
| `1001` | `9` | `$9` | brown | `#553800` |
| `1010` | `10` | `$a` | light red | `#c46c71` |
| `1011` | `11` | `$b` | dark gray | `#4a4a4a` |
| `1100` | `12` | `$c` | medium gray | `#7b7b7b` |
| `1101` | `13` | `$d` | light green | `#a9ff9f` |
| `1110` | `14` | `$e` | light blue | `#706deb` |
| `1111` | `15` | `$f` | light gray | `#b2b2b2` |

These HTML hex values match the project palette plugin in [../data/palettes/c64/plugin.js](../data/palettes/c64/plugin.js).

## Color RAM

Color RAM is the special color-memory area at:

- `$d800-$dbff`

Important behavior:

- one address = one screen cell color entry
- the meaningful value is a 4-bit color index
- for a flattened 40x25 layout, entries are ordered left to right, then top to bottom

So:

- `$d800` = row 0, column 0
- `$d801` = row 0, column 1
- ...
- `$d827` = row 0, column 39
- `$d828` = row 1, column 0

Color RAM is not stored as neighboring `FG,BG,FG,BG` nibble pairs.

Instead:

- one address corresponds to one cell color value

## Screen RAM Color Pairs In Standard Bitmap Mode

In standard bitmap mode, the per-cell two-color combination comes from the screen RAM byte for that cell.

That means:

- one byte per 8x8 cell
- upper nibble = one cell color
- lower nibble = the other cell color
- arranged left to right, then top to bottom by 40x25 cell order

So this is not:

- one nibble for cell 0 foreground, then one nibble for cell 1 background

Instead, it is:

- one full byte per cell
- each byte contains that cell’s two color nibbles

### Example

```text
[00100111]
```

Split into nibbles:

- upper nibble = `0010` = decimal `2` = red
- lower nibble = `0111` = decimal `7` = yellow

So that one screen RAM byte means that this one 8x8 bitmap cell uses:

- color `2` (`red`)
- color `7` (`yellow`)

The bitmap bits for that cell decide which of those two colors each pixel receives.

## Where The Global Background Lives

In the bitmap discussions for this project:

- the per-cell two-color pair comes from screen RAM
- the global background register is `$d021`

So the full picture is:

- bitmap RAM = the 1-bit pattern
- screen RAM = the two per-cell color nibbles
- `$d021` = global background register used by the current display mode/setup

## Related Docs

- [README.md](README.md)
- [memory-map.md](memory-map.md)
- [notes/bitmap-mode.md](notes/bitmap-mode.md)
- [glossary.md](glossary.md)
