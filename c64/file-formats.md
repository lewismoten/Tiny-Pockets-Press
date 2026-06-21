# C64 File Formats

Parent: [C64 README](README.md)

## Disk Contents

Each generated disk can contain some or all of the following:

- `BOOK.PRG`: BASIC launcher and higher-level reader logic.
- `LOADER.PRG`: machine-language loader installed into RAM and called from BASIC.
- `BOOK.IDX`: compact relative file describing where tagged content lives.
- `1.DAT`, `2.DAT`, `4.DAT`, `8.DAT`, `16.DAT`, `32.DAT`, `64.DAT`, `128.DAT`, `256.DAT`, `512.DAT`, `1024.DAT`: payload files grouped by fixed record size.

Shared records such as `HOM`, `TOC`, `COV`, and prompt sprite records may be duplicated across disks so the reader can still show core UI without immediately forcing a swap.

Current storage choice:

- `BOOK.IDX` is exported as a `REL` file with 9-byte records.
- `.DAT` files whose fixed record size is `254` bytes or smaller currently export as `REL`.
- `256.DAT`, `512.DAT`, and `1024.DAT` still export as `SEQ` for now.

## BOOK.IDX Record Layout

`BOOK.IDX` uses fixed 9-byte relative records:

1. `tag[3]`
2. `diskClass[1]`
3. `startRecord[2]` little-endian
4. `recordCount[1]`
5. `nextRecord[2]` little-endian

## Special Records

- `DSK`: first record in the file. Identifies the disk number and total disk count.
- `TAG`: sentinel head record used as an early-out while searching tag heads.

## Tag Head Strategy

After the first `DSK` record, the file contains one head record per unique tag, followed by the `TAG` sentinel, followed by the actual records.

Head records:

- use data class `0`
- carry no payload location
- use `nextRecord` to point at the first actual record for that tag

Actual records:

- are linked together through `nextRecord`
- use `0` in `nextRecord` to mark the end of the chain

This makes it possible to jump to the first record for a tag without scanning the entire index.

## `diskClass` Encoding

`diskClass` is packed into one byte:

- upper nibble: disk number minus 1, range `0-15` for disks `1-16`
- lower nibble: data class, range `0-15`

Class `0` means metadata only and does not point to a `.DAT` file.

## DAT Class Mapping

The current implementation maps data classes like this:

| Class | File |
| --- | --- |
| 0 | metadata only |
| 1 | `1.DAT` |
| 2 | `2.DAT` |
| 3 | `4.DAT` |
| 4 | `8.DAT` |
| 5 | `16.DAT` |
| 6 | `32.DAT` |
| 7 | `64.DAT` |
| 8 | `128.DAT` |
| 9 | `256.DAT` |
| 10 | `512.DAT` |
| 11 | `1024.DAT` |

The file name directly represents the record size in bytes.

## Tagged Content

Current tags used or planned by the exporter/reader include:

- `HOM`: home screen metadata fields
- `TOC`: table of contents data
- `COV`: cover image asset
- `PAG`: graphic book page asset
- `ANK`: `PRESS ANY KEY` prompt sprite data
- `BAK`: `BACK` back navigation sprite data
- `ESC`: `HOME` home/escape navigation sprite data
- `NXT`: `NEXT` next navigation sprite data
- `DSK`: disk metadata
- `TAG`: tag-head sentinel

## Home Metadata Payload

`HOM` records are stored as structured field data. The current format is:

1. `colorByte[1]`
2. `nameLength[1]`
3. `name[nameLength]`
4. `valueLength[1]`
5. `value[valueLength]`

`colorByte` packs the field-name color and field-value color into nibbles.

## TOC Payload

The table of contents payload is a list of entries:

1. `titleLength[1]`
2. `title[titleLength]`
3. `target[2]`

Right now `target` may still be `0xffff` when not yet resolved.

A leading space in the title indicates an indented child entry.

## Cover and Graphic Page Payload

The current graphic export uses C64 standard bitmap mode and stores image payloads as record streams referenced by `COV` and `PAG`.

The core image payload written by the exporter is:

1. screen RAM bytes: 1024 bytes
2. bitmap bytes: 8000 bytes

That combined payload is then split into fixed-size DAT records according to the chosen class.

## Prompt Sprite Payload

Prompt words such as `PRESS ANY KEY`, `BACK`, `HOME`, and `NEXT` are emitted as sprite byte records. The current implementation builds sprite sheets suitable for loading into sprite memory and pointing the VIC-II sprite pointers at them.

## Standard Bitmap Mode Reminder

For standard bitmap mode:

- bitmap memory is 8000 bytes
- screen RAM is 1000 bytes
- each 8x8 cell gets two colors from screen RAM nibbles
- one global background color comes from `$d021`

The exporter dither pass reduces source art to this layout before packaging.

## Related Docs

- [README.md](README.md)
- [d64-format.md](d64-format.md)
- [book-reader.md](book-reader.md)
- [assembly-programs.md](assembly-programs.md)
