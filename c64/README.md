# C64 Export Notes

This folder documents the current Commodore 64 export pipeline implemented in [js/export.js](../js/export.js).

The current exporter builds one or more `.d64` disk images containing:

- `BOOK.PRG`: BASIC bootstrap and UI logic.
- `LOADER.PRG`: machine-language loader/reader support.
- `BOOK.IDX`: compact index records for cover, home metadata, TOC, page graphics, and prompt sprites.
- `*.DAT`: random-access style data buckets grouped by record size.

## Project Intent

The direction of this reader is to push as much runtime logic as practical into machine language so the C64 can:

- load assets faster than equivalent BASIC loops
- make fuller use of KERNAL file and device routines
- keep the interface responsive while data is still loading
- show progressive visual feedback instead of making the user wait on a blank pause
- allow keyboard interruption during long-running loads so the user can move between screens, pages, or menus

The preferred user experience is:

- show partial data as soon as it is available
- show a real progress bar when the target is finite
- fall back to a busy indicator or animation when progress cannot be measured exactly

## Generic Reader Goal

The loader, reader, engine, and support files are meant to be generic. They should not contain book-specific content beyond whatever is discovered through:

- `BOOK.IDX`
- `*.DAT`
- other generic asset files referenced by those records

That separation is important because it allows the runtime portion to be redistributed as its own reader/viewer while someone else supplies their own book data by editing or replacing the index and data files.

## Docs In This Folder

- [file-formats.md](file-formats.md): disk files, index records, DAT classes, bitmap payload structure.
- [d64-format.md](d64-format.md): general 1541 D64 structure, BAM, directory layout, sector chains, and block counts.
- [book-reader.md](book-reader.md): how the C64 reader currently boots and navigates.
- [memory-map.md](memory-map.md): addresses used by bitmap mode, sprites, buffers, and loader code.
- [assembly-programs.md](assembly-programs.md): ML components and what each one is responsible for.

## Internal Notes

The [notes/](notes/) folder is a working reference set for future implementation work. It includes:

- BASIC V2 reminders
- banking and overlay behavior
- 6502 instruction notes
- KERNAL entry points used by the loader
- bitmap/screen/color memory notes
- D64 and record-packing notes
- PETSCII/screen code reminders

## Scope

These notes describe the current exporter and reader as they exist in the codebase today. Some sections also call out intended behavior where the implementation is still in progress.
