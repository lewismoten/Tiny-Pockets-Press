# D64 Geometry And BAM

Parent pages: [D64 Format](d64-format.md), [C64 README](README.md)

This page documents the standard Commodore 1541-style `.d64` disk image structure that
the exporter targets.

It exists because a lot of C64 export bugs show up at the disk-structure level first:

- wrong block counts in the directory
- broken track/sector chains
- wrong BAM updates
- wrong directory layout
- files that load in an emulator but not on a real DOS-compatible path

## What A `.d64` Usually Represents

A standard `.d64` is typically a sector-by-sector image of a `35`-track Commodore 1541
floppy disk.

The normal image size for a plain `35`-track disk without extra error bytes is:

- `174848` bytes

That comes from:

- `683` sectors total
- `256` bytes per sector

## Sector Size

Each sector is:

- `256` bytes

Commodore DOS treats the first two bytes of most file-data sectors as a link to the next
sector in the chain, leaving:

- `254` payload bytes per linked file sector

That is why a file’s actual data capacity is not simply `blocks * 256`.

## Track / Sector Geometry

The `1541` does not use the same number of sectors on every track.

| Tracks | Sectors per track | Bytes per track |
| --- | --- | --- |
| `1-17` | `21` | `5376` |
| `18-24` | `19` | `4864` |
| `25-30` | `18` | `4608` |
| `31-35` | `17` | `4352` |

Total standard sectors:

- `17 * 21 = 357`
- `7 * 19 = 133`
- `6 * 18 = 108`
- `5 * 17 = 85`
- total = `683`

## Standard Capacity

One standard DOS track is reserved for directory and allocation information:

- track `18`

That leaves:

- `664` free blocks after a normal format

Because normal file sectors only contribute `254` data bytes each, usable file payload on
a freshly formatted disk is:

- `664 * 254 = 168656` bytes

## Track 18

Track `18` is special.

### `18/0`

Sector `18/0` contains:

- BAM (Block Availability Map)
- disk header information
- pointer to first directory sector

### `18/1` and onward

The directory starts at:

- `18/1`

Additional directory sectors are linked in a normal track/sector chain if more entries are
needed.

## BAM Structure

The BAM tracks free space by track and sector.

In the standard `1541` layout, sector `18/0` includes:

- pointer to first directory sector, usually `18/1`
- DOS version byte
- BAM entries for tracks `1-35`
- disk name
- disk ID
- DOS type

Each BAM entry for a track occupies `4` bytes:

1. free-sector count for that track
2. sector bitmap byte `0`
3. sector bitmap byte `1`
4. sector bitmap byte `2`

The bitmap marks which sectors on that track are free or allocated.

## Disk Name, ID, And DOS Type

The disk header area on `18/0` includes:

- disk name / label
- disk ID
- DOS type

Common expectations:

- disk name: `16` bytes, usually padded with `$a0`
- disk ID: `2` bytes
- DOS type: commonly `2A`

In a normal directory listing, the disk name appears in the quoted title line.

## Standard Track 18 Responsibilities

When generating a D64, the exporter needs to manage all of this correctly:

- `18/0`: BAM + header
- `18/1+`: directory sectors
- block allocations on data tracks
- sector chaining for every exported file
- block counts for every directory entry

## Non-Standard Extensions

Some tools or protected disks use non-standard variations such as:

- tracks beyond `35`
- custom loaders
- altered BAM behavior
- sector error tables
- extra per-sector error bytes appended to the image

This project currently targets the standard DOS-friendly `35`-track case unless
explicitly extended.

## Related Docs

- [d64-directory-and-files.md](d64-directory-and-files.md)
- [file-formats.md](file-formats.md)
- [notes/d64-layout.md](notes/d64-layout.md)
