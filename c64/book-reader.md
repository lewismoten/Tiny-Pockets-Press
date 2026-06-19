# Book Reader Flow

This file describes how the generated reader is intended to work on the C64.

Parent: [C64 README](README.md)

## Guiding Behavior

The reader is intended to feel active while work is happening, not stalled. That means:

- progressively reveal metadata and graphics whenever possible
- show a progress bar when the reader knows how much work remains
- show a busy animation when the work has no clean finite target
- allow the keyboard to interrupt long loading operations so the user can back out to a menu or move on

This is one of the main reasons more logic is being moved from BASIC into machine language.

## Boot Sequence

1. `BOOK.PRG` starts in BASIC.
2. BASIC loads or installs `LOADER.PRG`.
3. The loader provides machine-language routines for:
   - cover streaming
   - prompt sprite loading
   - record reads into RAM
4. BASIC reads `BOOK.IDX`, verifies the disk identity, and begins loading metadata.

## Home Screen

The home screen is the reader hub. It can display:

- title
- author
- publisher
- other `HOM` records stored in `BOOK.IDX`/`*.DAT`

The current direction is to make the home screen progressively populate as `HOM` records are discovered and loaded.

## Cover Behavior

If a `COV` record is present:

1. the cover loads first
2. the bitmap is shown in standard bitmap mode
3. after a short delay, prompt sprites can appear
4. pressing a key should move directly to the home screen

The desired behavior during cover loading is to show visible progress rather than wait silently. If a true percent is known, show it. If not, animate a busy state or progressively reveal the image data itself.

If no `COV` record exists, the reader should go directly to the home screen.

## TOC Behavior

Pressing `T` on the home screen opens the table of contents when a `TOC` tag exists.

Current design expectations:

- up to 9 chapter choices visible at once
- chapter numbers `1-9`
- paging when more entries exist than fit on one screen
- wrapped text aligned with the title start position
- `H` returns to the home screen

## Graphic Reading Mode

Pressing `G` on the home screen enters graphic page viewing mode.

The reader resolves sequential `PAG` records and uses the loader to fetch page image data.

The same progressive-loading rules apply here:

- show the page as it becomes available
- permit user interruption during the load
- avoid freezing in an unresponsive state while disk IO is in flight

### Planned/Current Navigation Keys

- `N`, `D`, `Space`: next page
- `Backspace`, `B`, `P`, `A`: previous page
- `H`, `W`: home screen

When the current page is the first or last one, navigation can return to the home screen instead of wrapping forever.

## Disk Swaps

Graphic pages may span multiple `.d64` images. `BOOK.IDX` includes disk information so the reader can:

1. determine which disk is currently inserted
2. determine which disk contains a requested record
3. prompt for the required disk
4. re-check the inserted disk via the `DSK` record

## Record Lookup Strategy

`BOOK.IDX` is no longer meant to be scanned from top to bottom for every request.

The intended lookup path is:

1. find the head entry for the requested tag
2. jump to the first actual record through `nextRecord`
3. follow the linked records until the desired one is found
4. stop when `nextRecord = 0`
5. stop early if the `TAG` sentinel is reached while scanning heads

## Loader Responsibilities

The machine-language loader is meant to handle the byte-heavy work:

- file open/read/close
- skipping ahead within a payload stream
- copying streamed bytes into the correct RAM destination
- progressively showing image data as it arrives
- exposing interruptible loading behavior to the user interface
- driving progress or busy-state feedback when possible

BASIC remains responsible for menu flow, tag lookup, disk prompts, and higher-level reader state.

Longer term, more of the expensive or timing-sensitive logic should move into ML as long as the book-specific content still lives outside the engine in index and data files.

## Related Docs

- [assembly-programs.md](assembly-programs.md)
- [file-formats.md](file-formats.md)
- [d64-format.md](d64-format.md)
