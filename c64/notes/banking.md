# C64 Banking And Overlays

This note explains the C64’s banked/overlay behavior in a little more detail than the main [memory-map.md](../memory-map.md).

## Why Banking Exists

The CPU can only address 64 KB at once, but the machine contains:

- 64 KB RAM
- BASIC ROM
- KERNAL ROM
- character ROM
- I/O devices

The C64 solves that by letting some address ranges show different things at different times.

## Main Banked CPU Ranges

| Range | Possible visible contents |
| --- | --- |
| `$8000-$9fff` | RAM or cartridge low ROM |
| `$a000-$bfff` | RAM, BASIC ROM, or cartridge high ROM |
| `$d000-$dfff` | RAM, I/O, or character ROM |
| `$e000-$ffff` | RAM or KERNAL ROM |

## The 6510 Port

Two important addresses control much of this:

| Address | Purpose |
| --- | --- |
| `$0000` | data direction register |
| `$0001` | processor port value |

`$0001` is the one most code talks about when switching ROM or I/O visibility.

## Common Practical Rules

- BASIC ROM visible: `$a000-$bfff` reads as BASIC ROM
- KERNAL visible: `$e000-$ffff` reads as KERNAL ROM
- I/O visible: `$d000-$dfff` reads as hardware registers and color RAM
- I/O hidden: `$d000-$dfff` can instead show character ROM or underlying RAM

## Hidden RAM

Even when ROM is visible, the RAM underneath still exists.

Common workflow:

1. write RAM under a ROM-covered address
2. bank the ROM out
3. read or execute the RAM that was hidden underneath
4. bank the ROM back in

That is one of the classic C64 programming tricks.

## Character ROM Access

The character ROM is not usually visible to the CPU, even though the VIC uses character data constantly in text mode.

To inspect character ROM bytes from the CPU side, code usually:

1. changes banking so I/O is no longer visible
2. exposes the character ROM at `$d000-$dfff`
3. reads the ROM bytes
4. restores the previous mapping

Because this temporarily hides I/O, programmers often disable interrupts briefly while doing it.

## Cartridge Influence

Cartridges can change what appears in:

- `$8000-$9fff`
- `$a000-$bfff`
- `$e000-$ffff` in some special modes

This is why cartridge-aware software often talks about `ROML`, `ROMH`, `GAME`, and `EXROM`.

## “Dead” Or Mirrored Areas

When people say an address range is weird or dead, they often mean one of these:

- the range mirrors a smaller register block
- the range only responds if optional hardware exists
- the range is covered by ROM or I/O unless explicitly banked out

So on the C64, “memory map” is really “address-space behavior map”.
