# C64 I/O And Banking

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

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
| `$d040-$d3ff` | mirrored view | repeats of VIC-II register block |

### SID

| Range | Length | Purpose |
| --- | --- | --- |
| `$d400-$d418` | `25` bytes used | 3 voices, ADSR, filter, volume |
| `$d420-$d7ff` | mirrored view | repeats of SID register block |

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

## Cartridge And Expansion Areas

| Range | Length | Typical use |
| --- | --- | --- |
| `$8000-$9fff` | `8192` bytes | low cartridge ROM (`ROML`) or RAM when no cartridge is active |
| `$a000-$bfff` | `8192` bytes | BASIC ROM by default, or high cartridge ROM (`ROMH`) depending on cartridge mode |
| `$de00-$deff` | `256` bytes | cartridge I/O 1 |
| `$df00-$dfff` | `256` bytes | cartridge I/O 2 |

## Bank Switching And The 6510 Port

The two key addresses are:

| Address | Length | Purpose |
| --- | --- | --- |
| `$0000` | `1` byte | data direction register for the 6510 port |
| `$0001` | `1` byte | port value controlling ROM/I/O visibility and datasette lines |

In practice, `$0001` is the main memory-banking control byte programmers talk about.

For a deeper explanation, see [../notes/banking.md](../notes/banking.md).

## Character ROM Versus I/O Versus RAM

The `$d000-$dfff` page can present three different views:

1. I/O registers
2. character ROM
3. underlying RAM

Typical expectations:

- with I/O enabled: you see VIC/SID/CIA/color RAM
- with I/O disabled and character ROM selected: you see character glyph ROM
- with I/O disabled and ROM not selected: you can see RAM underneath

## Color RAM Is Special

| Range | Length | Notes |
| --- | --- | --- |
| `$d800-$dbff` | `1024` color entries | effectively 4-bit storage for text-cell colors |

Important practical behavior:

- screen RAM holds character or bitmap cell bytes
- color RAM holds one 4-bit color value per screen cell
- color RAM is not just “normal RAM in the D-page”

For detailed nibble and palette notes, see [../colors.md](../colors.md).

## Where FG/BG Pairs Actually Live

For standard bitmap mode:

- bitmap RAM gives the 1-bit pixel pattern
- screen RAM gives the two per-cell colors as a nibble pair
- `$d021` gives the global background register used by the mode setup

Color RAM is not where those two per-cell bitmap nibbles live in this mode.

## “Dead Zones”, Mirrors, And Unusual Areas

Common cases:

- VIC-II registers are mirrored through much of `$d000-$d3ff`
- SID registers are mirrored through much of `$d400-$d7ff`
- CIA registers repeat within their 256-byte windows
- I/O1 and I/O2 may appear empty unless cartridge hardware responds there

## Related Pages

- [address-space.md](address-space.md)
- [project-layout.md](project-layout.md)
- [../colors.md](../colors.md)
