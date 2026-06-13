# C64 Standard Bitmap Mode Notes

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

### Color RAM

In multicolor and other display setups color RAM matters differently, but the current bitmap export path is organized around standard bitmap screen bytes plus global background.

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
