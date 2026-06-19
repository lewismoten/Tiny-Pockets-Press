# C64 Standard Bitmap Mode Notes

Parent pages: [Notes Index](README.md), [C64 README](../README.md)

## Mode Summary

Standard bitmap mode on the C64 gives:

- 320 x 200 pixels
- 1 bit per pixel inside each 8x8 cell
- 2 per-cell colors from screen RAM
- 1 global background color from `$d021`

## Memory Structure

### Bitmap

- 8000 bytes total
- each 8x8 cell consumes 8 bytes
- each byte is one row of 8 pixels

### Screen RAM

- 1000 bytes total
- one byte per 8x8 cell
- upper nibble = one color
- lower nibble = second color
- arranged left to right, top to bottom by 40x25 cell order

For a concrete byte/nibble/color example, see [../colors.md](../colors.md).

So this is not:

- cell 0 foreground in one nibble, cell 1 background in the next nibble

Instead, it is:

- one full byte per cell
- each byte contains that cell’s two color nibbles

### Color RAM

In multicolor and other display setups color RAM matters differently, but the current bitmap export path is organized around standard bitmap screen bytes plus global background.

Important distinction:

- color RAM is one 4-bit value per cell at `$d800-$dbff`
- standard bitmap mode color pairs come from screen RAM bytes, not from packing neighboring color RAM entries together

For the fuller color-RAM and palette explanation, see [../colors.md](../colors.md).

## Addressing In This Project

Current chosen locations:

- bitmap at `$4000`
- screen RAM at `$6000`
- sprite bytes at `$6400`
- temporary load buffer at `$7000`

## VIC Setup Used

- `$d011` bitmap bit enabled
- `$d016` currently set to standard mode-compatible value used by the exporter
- `$d018` points VIC-II at the chosen screen/bitmap layout
- `$dd00` selects the VIC bank

## Progressive Loading Strategy

The current loader streams:

1. screen RAM first
2. bitmap memory in chunks copied from a temporary buffer

That is why early partial display artifacts often look like color blocks before the full bitmap data has landed.

## Why Partial Images Can Look Wrong Mid-Load

If screen RAM has been loaded but the bitmap body has not:

- colors may already be correct
- pixels are still old, zeroed, or incomplete
- you can see striped, blocky, or noisy transitional frames

This is expected unless the loader deliberately masks the screen or stages updates differently.

## Related Notes

- [../colors.md](../colors.md)
- [../memory/project-layout.md](../memory/project-layout.md)
- [../book-reader.md](../book-reader.md)
