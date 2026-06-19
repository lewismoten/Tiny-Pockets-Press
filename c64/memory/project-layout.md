# Project Memory Layout

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

This page focuses on the bitmap cover/page pipeline and loader layout used by this
project.

## VIC-II Bitmap Layout Used By This Project

| Purpose | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| bitmap base | `$4000` | `$5f3f` | `8000` bytes | standard bitmap area |
| screen RAM base | `$6000` | `$63ff` | `1024` bytes | 1000 visible bytes plus sprite pointers near the end |
| sprite data base | `$6400` | `$65ff` | `512` bytes | prompt sprite storage |
| load buffer | `$7000` | `$713f` | `320` bytes | temporary stream buffer while loading bitmap bands |

## VIC-II Registers Used By This Project

| Register | Address | Length | Purpose |
| --- | --- | --- | --- |
| sprite enable | `$d015` | `1` byte | show/hide overlay sprites |
| sprite X MSB | `$d010` | `1` byte | high bits for sprites past X=255 |
| horizontal control | `$d016` | `1` byte | current code uses `$08` |
| vertical/bitmap control | `$d011` | `1` byte | bitmap bit enabled during display |
| memory pointers | `$d018` | `1` byte | current code uses `$80` |
| border color | `$d020` | `1` byte | border color |
| background color 0 | `$d021` | `1` byte | global bitmap background |
| VIC bank select | `$dd00` | `1` byte | current code uses bank value `0x02` |

## Sprite Pointer Area Used By This Project

Because project screen RAM is based at `$6000`, the sprite pointer table lives at:

| Purpose | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| sprite pointer table | `$63f8` | `$63ff` | `8` bytes | one pointer byte per sprite |

## Zero Page Usage By This Project

The ML loader temporarily reuses:

| Purpose | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| pointer pair 1 | `$fb` | `$fc` | `2` bytes | temporary source/destination pointer |
| pointer pair 2 | `$fd` | `$fe` | `2` bytes | temporary source/destination pointer |

It saves and restores their previous contents.

## Loader Code Placement Used By This Project

| Component | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| main loader/reader ML | `$c000` | `$c7ff` | `2048` bytes reserved | main machine-language body |
| bootstrap loader | `$c800` | `$c8ff` | `256` bytes reserved | small loader bootstrap |
| loader config/vars | `$c900` | `$c9ff` | `256` bytes reserved | config block and state bytes |

## Loader Variable Block Used By This Project

| Start | End | Length | Notes |
| --- | --- | --- | --- |
| `$c900` | `$c939` | `58` bytes | variables used by both cover loading and generic record reads |

It includes fields such as:

- status
- filename length
- filename buffer
- file-open flag
- source pointer
- destination pointer
- length
- band counter
- cover record info
- prompt record info
- skip/read lengths
- interactive mode flag

## Standard Bitmap Memory Reminder

In standard bitmap mode:

- bitmap data = 8000 bytes
- screen RAM = 1000 visible bytes inside a 1024-byte page
- color RAM = usually `$d800-$dbff`

| Region | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| bitmap memory | `$4000` | `$5f3f` | `8000` bytes | 320x200 bitmap payload |
| screen RAM page | `$6000` | `$63ff` | `1024` bytes | includes 1000 visible cell bytes plus sprite pointers |
| visible screen cell bytes | `$6000` | `$63e7` | `1000` bytes | 40x25 cell color pairs |
| sprite pointers | `$63f8` | `$63ff` | `8` bytes | one byte per sprite |
| color RAM | `$d800` | `$dbff` | `1024` entries | standard C64 color RAM range |

Each 8x8 character cell corresponds to:

- 8 bytes in bitmap memory
- 1 byte in screen RAM

The high nibble and low nibble in screen RAM select the two per-cell colors used with
the cell bitmap bits.

## Related Pages

- [README.md](README.md)
- [../memory-map.md](../memory-map.md)
- [../notes/bitmap-mode.md](../notes/bitmap-mode.md)
