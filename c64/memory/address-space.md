# C64 Address Space

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

## Big Picture

The C64 CPU can address:

- `$0000-$ffff`
- `65536` total byte locations

But some of those addresses are overlays rather than one fixed physical RAM chip.
Depending on the current banking state, the CPU may see:

- RAM
- ROM
- I/O registers
- color RAM
- cartridge ROM
- hidden RAM underneath ROM or I/O

## Default Power-On CPU View

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

## Hidden RAM Under ROM And I/O

The most important C64 banking idea is that a visible ROM or I/O region usually still
has RAM underneath it.

| Visible range | What is normally visible | Hidden thing underneath |
| --- | --- | --- |
| `$a000-$bfff` | BASIC ROM | RAM |
| `$d000-$dfff` | I/O or character ROM | RAM |
| `$e000-$ffff` | KERNAL ROM | RAM |

This is the “same address, different visible memory” behavior that makes overlay
techniques possible.

## Common System Work Areas

| Range | Length | Notes |
| --- | --- | --- |
| `$0000-$00ff` | `256` bytes | zero page |
| `$0100-$01ff` | `256` bytes | stack |
| `$0200-$02ff` | `256` bytes | buffers / vectors / work area |
| `$0300-$0333` | varies | KERNAL vector area often discussed in hook/patch work |
| `$0400-$07e7` | `1000` bytes | visible default text screen |
| `$07e8-$07ff` | `24` bytes | trailing portion of the 1 KB screen page |
| `$0801-...` | dynamic | BASIC program text and then variables above it |

## Related Pages

- [io-and-banking.md](io-and-banking.md)
- [project-layout.md](project-layout.md)
- [../memory-map.md](../memory-map.md)
