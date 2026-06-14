# C64 Address Space And Memory Map

This file is the primary map for the Commodore 64 address space.

It covers two related but different ideas:

1. what the CPU can address from `$0000-$ffff`
2. what this project currently uses inside that space

The C64 is not just “64 KB of RAM”. Several address ranges can show:

- RAM
- ROM
- I/O registers
- color RAM
- cartridge ROM
- hidden RAM underneath ROM or I/O

Which thing you see depends on the current banking state.

## Big Picture

The C64 CPU can address:

- `$0000-$ffff`
- `65536` total addressable byte locations

But some of those locations are overlays rather than one fixed physical memory chip.

## Default Power-On CPU View

This is the normal CPU-facing map after power-up, with BASIC and KERNAL visible.

| Range | Length | Default visible thing | Notes |
| --- | --- | --- | --- |
| `$0000-$00ff` | `256` bytes | RAM | zero page, including 6510 port at `$0000/$0001` |
| `$0100-$01ff` | `256` bytes | RAM | hardware stack |
| `$0200-$03ff` | `512` bytes | RAM | KERNAL/BASIC work areas, vectors, buffers |
| `$0400-$07ff` | `1024` bytes | RAM | default text screen at `$0400-$07e7` |
| `$0800-$7fff` | `30720` bytes | RAM | BASIC program area, variables, ML, buffers |
| `$8000-$9fff` | `8192` bytes | RAM or cartridge ROM | cartridge low ROM area (`ROML`) when present |
| `$a000-$bfff` | `8192` bytes | BASIC ROM | RAM exists underneath |
| `$c000-$cfff` | `4096` bytes | RAM | common ML area |
| `$d000-$dfff` | `4096` bytes | I/O + color RAM | can instead expose character ROM or underlying RAM |
| `$e000-$ffff` | `8192` bytes | KERNAL ROM | RAM exists underneath |

## Common Logical Areas

These are the regions most programmers usually think about first.

| Purpose | Start | End | Length | Notes |
| --- | --- | --- | --- | --- |
| zero page | `$0000` | `$00ff` | `256` bytes | fastest addressing modes live here |
| hardware stack | `$0100` | `$01ff` | `256` bytes | used by `JSR`, `RTS`, interrupts, pushes/pulls |
| BASIC text/program start | `$0801` | varies | dynamic | BASIC programs usually begin here |
| default text screen page | `$0400` | `$07ff` | `1024` bytes | visible text cells use first 1000 bytes |
| color RAM | `$d800` | `$dbff` | `1024` nybbles | separate 4-bit color memory |
| BASIC ROM | `$a000` | `$bfff` | `8192` bytes | visible by default at startup |
| character ROM window | `$d000` | `$dfff` | `4096` bytes | only visible to CPU when I/O is banked out |
| KERNAL ROM | `$e000` | `$ffff` | `8192` bytes | visible by default at startup |

## The I/O Page

When I/O is enabled, `$d000-$dfff` is not ordinary RAM from the CPU’s point of view.

| Range | Length | Default visible thing | Notes |
| --- | --- | --- | --- |
| `$d000-$d3ff` | `1024` bytes | VIC-II registers and mirrors | video chip registers repeat through the range |
| `$d400-$d7ff` | `1024` bytes | SID registers and mirrors | sound chip voices, filters, paddles |
| `$d800-$dbff` | `1024` bytes | color RAM | 4-bit storage, upper bits not normal RAM |
| `$dc00-$dcff` | `256` bytes | CIA 1 and mirrors | keyboard, joystick, timers, interrupts |
| `$dd00-$ddff` | `256` bytes | CIA 2 and mirrors | VIC bank select, serial bus, timers |
| `$de00-$deff` | `256` bytes | I/O 1 | often cartridge or expansion hardware |
| `$df00-$dfff` | `256` bytes | I/O 2 | often cartridge or expansion hardware |

## Common Hardware In The I/O Page

### VIC-II

| Range | Length | Purpose |
| --- | --- | --- |
| `$d000-$d02e` | `47` bytes used | sprite positions, raster, control, colors |
| `$d02f-$d03f` | varies/mirrors | mirror/unused behavior depends on chip decoding |
| `$d040-$d3ff` | mirrored view | repeats of VIC-II register block |

### SID

| Range | Length | Purpose |
| --- | --- | --- |
| `$d400-$d418` | `25` bytes used | 3 voices, ADSR, filter, volume |
| `$d419-$d41c` | `4` bytes readable-only in practice | paddle / oscillator / envelope related reads |
| `$d420-$d7ff` | mirrored view | repeats of SID register block |

This is the “voice / speaker / sound” region most people mean when talking about sound hardware on the C64.

### CIA 1

| Range | Length | Purpose |
| --- | --- | --- |
| `$dc00-$dc0f` | `16` bytes used | keyboard matrix, joystick, timers, TOD clock, IRQ |
| `$dc10-$dcff` | mirrored view | repeats of CIA1 register block |

### CIA 2

| Range | Length | Purpose |
| --- | --- | --- |
| `$dd00-$dd0f` | `16` bytes used | VIC bank select, serial bus, timers, NMI-related control |
| `$dd10-$ddff` | mirrored view | repeats of CIA2 register block |

This is the region the current exporter uses for VIC bank selection via `$dd00`.

## Cartridge And Expansion Areas

These are the normal cartridge-facing regions in the CPU map.

| Range | Length | Typical use |
| --- | --- | --- |
| `$8000-$9fff` | `8192` bytes | low cartridge ROM (`ROML`) or RAM when no cartridge is active |
| `$a000-$bfff` | `8192` bytes | BASIC ROM by default, or high cartridge ROM (`ROMH`) depending on cartridge mode |
| `$de00-$deff` | `256` bytes | cartridge I/O 1 |
| `$df00-$dfff` | `256` bytes | cartridge I/O 2 |

Some cartridge modes, including Ultimax-style mapping, change the normal expectations dramatically.

## Hidden RAM Under ROM And I/O

One of the most important C64 ideas is that some visible ROM or I/O ranges still have RAM underneath them.

That means:

- you can often write RAM “under” ROM even while ROM is visible
- you cannot read that hidden RAM back until you bank the ROM or I/O out

The most important hidden-RAM regions are:

| Visible range | What is normally visible | Hidden thing underneath |
| --- | --- | --- |
| `$a000-$bfff` | BASIC ROM | RAM |
| `$d000-$dfff` | I/O or character ROM | RAM |
| `$e000-$ffff` | KERNAL ROM | RAM |

This is the banked/overlay behavior you were describing: the address stays the same, but what you can see there changes.

## Bank Switching And The 6510 Port

The C64 uses the 6510 CPU’s built-in I/O port to control which major memory regions are visible.

The two key addresses are:

| Address | Length | Purpose |
| --- | --- | --- |
| `$0000` | `1` byte | data direction register for the 6510 port |
| `$0001` | `1` byte | port value controlling ROM/I/O visibility and datasette lines |

In practice, `$0001` is the main memory-banking control byte programmers talk about.

It controls whether the CPU sees:

- BASIC ROM or RAM at `$a000-$bfff`
- I/O or character ROM or RAM at `$d000-$dfff`
- KERNAL ROM or RAM at `$e000-$ffff`

This is why the same address can appear to hold completely different data depending on the current banking state.

For a deeper explanation, see [notes/banking.md](notes/banking.md).

## Character ROM Versus I/O Versus RAM

The `$d000-$dfff` page is special because it can present three different views:

1. I/O registers
2. character ROM
3. underlying RAM

Typical expectations:

- with I/O enabled: you see VIC/SID/CIA/color RAM
- with I/O disabled and character ROM selected: you see character glyph ROM
- with I/O disabled and ROM not selected: you can see RAM underneath

This is one of the most confusing but most useful areas on the machine.

## Color RAM Is Special

Color RAM is not ordinary 8-bit main RAM.

| Range | Length | Notes |
| --- | --- | --- |
| `$d800-$dbff` | `1024` color entries | effectively 4-bit storage for text-cell colors |

Important practical behavior:

- screen RAM holds character or bitmap cell bytes
- color RAM holds one 4-bit color value per screen cell
- color RAM is not just “normal RAM in the D-page”

If you linearize color RAM as a 40x25 screen, the order is:

- left to right across a row
- then top to bottom across rows

So:

- `$d800` = row 0, column 0
- `$d801` = row 0, column 1
- ...
- `$d827` = row 0, column 39
- `$d828` = row 1, column 0

Color RAM itself is not stored as `FG,BG,FG,BG` nibble pairs for neighboring cells.

Instead:

- one address = one cell color entry
- only the low nibble is meaningful for the cell color value

## Where FG/BG Pairs Actually Live

This is the part that is easy to mix up:

- color RAM is one 4-bit color per cell
- screen RAM bytes may contain two color nibbles in some display modes

For standard bitmap mode, the per-cell foreground/background-style pair is taken from the screen RAM byte for that cell:

- high nibble = one cell color
- low nibble = the other cell color

That screen RAM byte is arranged left to right, top to bottom by cell, one byte per 8x8 cell.

So for standard bitmap mode:

- bitmap RAM gives the 1-bit pixel pattern
- screen RAM gives the two per-cell colors as a nibble pair
- `$d021` gives the global background register used by the mode setup

Color RAM is not where those two per-cell bitmap nibbles live in this mode.

## “Dead Zones”, Mirrors, And Unusual Areas

Not every range is fully decoded in a unique way.

Common cases:

- VIC-II registers are mirrored through much of `$d000-$d3ff`
- SID registers are mirrored through much of `$d400-$d7ff`
- CIA registers repeat within their 256-byte windows
- I/O1 and I/O2 may appear empty unless cartridge hardware responds there

So a range may exist in the address space even though only a small subset of addresses are truly unique hardware registers.

That is often what people mean by “dead zones” on the C64:

- address ranges that are mapped but not uniquely decoded
- mirrored hardware windows
- ranges that only do something if specific expansion hardware exists

## BASIC And KERNAL In The Address Space

### BASIC ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$a000-$bfff` | `8192` bytes | BASIC interpreter ROM, visible by default |

### KERNAL ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$e000-$ffff` | `8192` bytes | KERNAL ROM, jump table, IRQ/NMI/reset vectors |

Important high-end addresses:

| Range | Length | Purpose |
| --- | --- | --- |
| `$fffa-$fffb` | `2` bytes | NMI vector |
| `$fffc-$fffd` | `2` bytes | reset vector |
| `$fffe-$ffff` | `2` bytes | IRQ/BRK vector |

## Common System Work Areas

These are not “special chips”, but they are very commonly important.

| Range | Length | Notes |
| --- | --- | --- |
| `$0000-$00ff` | `256` bytes | zero page |
| `$0100-$01ff` | `256` bytes | stack |
| `$0200-$02ff` | `256` bytes | buffers / vectors / work area |
| `$0300-$0333` | varies | KERNAL vector area often discussed in hook/patch work |
| `$0400-$07e7` | `1000` bytes | visible default text screen |
| `$07e8-$07ff` | `24` bytes | trailing portion of the 1 KB screen page |
| `$0801-...` | dynamic | BASIC program text and then variables above it |

## VIC-II Bitmap Layout Used By This Project

The exporter’s current bitmap cover/page pipeline does not use the default text layout. It uses:

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

The current loader config block currently occupies:

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

The high nibble and low nibble in screen RAM select the two per-cell colors used with the cell bitmap bits.

If you flatten screen RAM by cell order, it is:

- left to right across 40 cells
- then top to bottom across 25 rows

So the byte at screen offset `n` corresponds to cell `n`, and that one byte contains:

- upper nibble = first cell color
- lower nibble = second cell color

That is different from color RAM, where one address represents one cell color entry rather than a packed two-cell or FG/BG stream.
