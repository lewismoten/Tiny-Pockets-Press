# D64 Directory And File Chains

Parent pages: [D64 Format](d64-format.md), [D64 Geometry](d64-geometry.md), [C64 README](README.md)

This page focuses on how files are represented inside the image once the track geometry
and BAM are understood.

## Directory Sector Structure

Each directory sector is also `256` bytes and starts with a normal next-track /
next-sector link:

1. byte `0`: next directory track
2. byte `1`: next directory sector

The rest of the sector is filled with directory entries.

There are `8` directory entries per directory sector.

Each directory entry is:

- `32` bytes

## Directory Entry Layout

A normal `1541` directory entry includes:

1. file type / flags
2. first data track
3. first data sector
4. filename area
5. side-sector / `REL` fields
6. file size in blocks

Important practical points:

- filename field is `16` bytes, usually padded with `$a0`
- the displayed block count is stored in the directory entry, it is not calculated live
  from the sector chain
- if that block-count field is left at zero, a directory will show every file as `0`
  blocks even if the sector chain is valid

That exact issue came up during this project, so it is worth calling out explicitly.

## File Sector Chains

For `PRG`, `SEQ`, `USR`, and similar normal file types, data is stored as a linked list
of sectors.

### Normal sector link

For most sectors in the chain:

- byte `0` = next track
- byte `1` = next sector
- bytes `2-255` = data payload

### Final sector link

For the last sector:

- byte `0` = `0`
- byte `1` = number of used bytes in the final sector plus `1`, in Commodore DOS convention

That is how DOS knows where the file ends.

## PRG Files

`PRG` files normally begin with a two-byte load address in the file data payload itself.

For C64 programs, a BASIC stub usually loads at:

- `$0801`

Machine-language programs may load elsewhere depending on how they are built.

## Directory Block Counts

The block count shown in a directory listing is the `16`-bit little-endian block field in
the directory entry.

It should reflect the number of disk blocks consumed by the file’s sector chain.

Important reminder:

- this is a block count, not a byte count
- it must be written correctly into the directory entry
- if it is zeroed, the file can still exist and still be loadable, but the directory
  display will be wrong

## Why Sector Chains Matter

The D64 image is not just a bag of named files. Each file needs:

- a directory entry
- a first track/sector pointer
- a valid linked chain of sectors
- a final-sector terminator
- BAM entries updated so the used sectors are marked allocated
- a correct displayed block count

If any of those are wrong, different emulators and real drives may behave differently.

## Relevance To Tiny Pockets Press

For this exporter, the D64 layer must be correct before the higher-level reader can work
reliably.

That especially includes:

- `BOOK.PRG`
- `LOADER.PRG`
- `BOOK.IDX`
- record-sized `*.DAT` files

Even if the ML loader and BASIC program are correct, a broken BAM, directory entry, or
sector chain will still break the book disk.

## Related Docs

- [d64-geometry.md](d64-geometry.md)
- [file-formats.md](file-formats.md)
- [notes/d64-layout.md](notes/d64-layout.md)
