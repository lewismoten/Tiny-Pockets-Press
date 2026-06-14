# C64 Glossary And Acronyms

This page explains the most common C64 terms, acronyms, and shorthand used throughout these docs.

It is meant to be a quick “what does that mean?” reference while reading the rest of the C64 documentation.

## Core Machine Terms

| Term | Meaning |
| --- | --- |
| `C64` | Commodore 64 |
| `CPU` | central processing unit; on the C64 this is the 6510, a 6502-family CPU with a built-in I/O port |
| `RAM` | random access memory; writable main memory |
| `ROM` | read-only memory; built-in firmware or cartridge code |
| `KB` | kilobyte; on these docs usually `1024` bytes |
| `ML` | machine language; native 6502-family code |
| `BASIC` | the Commodore BASIC interpreter built into the machine |
| `BASIC V2` | the version of Commodore BASIC in the C64 |
| `KERNAL` | Commodore’s name for the C64 operating-system ROM routines |

## Major Chips

| Term | Meaning |
| --- | --- |
| `VIC` | Video Interface Chip; general family name |
| `VIC-II` | the actual C64 video chip, successor to the earlier VIC |
| `SID` | Sound Interface Device; the C64 sound chip |
| `CIA` | Complex Interface Adapter; general chip family name used for timers, I/O, interrupts |
| `CIA1` | the first CIA chip, commonly used for keyboard, joystick, timers, IRQ-related duties |
| `CIA2` | the second CIA chip, commonly used for serial bus and VIC bank control |

## Interrupts And Timing

| Term | Meaning |
| --- | --- |
| `IRQ` | interrupt request |
| `NMI` | non-maskable interrupt |
| `BRK` | software break instruction; behaves like a forced interrupt |
| `TOD` | time of day; usually refers to the CIA clock feature |
| `jiffy` | a system time tick; C64 timekeeping often counts in jiffies |
| `MSB` | most significant bit; the highest-order bit in a value |
| `LSB` | least significant bit; the lowest-order bit in a value |

### Bit Numbering Example

For an 8-bit byte:

```text
76543210
^      ^
MSB    LSB
```

- bit `7` is the `MSB`
- bit `0` is the `LSB`

For a byte like:

```text
10100011
```

- `1` at the far left is the highest-order side
- `1` at the far right is the lowest-order side

So:

- `MSB` means “highest-value bit position”
- `LSB` means “lowest-value bit position”
- in everyday/plain-English thinking, when a binary value is written normally, `MSB` is the left-most bit and `LSB` is the right-most bit

This idea also applies to larger values:

For a 4-bit nibble:

```text
3210
^  ^
MSB LSB
```

- bit `3` is the `MSB`
- bit `0` is the `LSB`

For a 16-bit value:

```text
fedcba9876543210
^              ^
15             0
MSB            LSB
```

- bit `15` (hex digit position `f`) is the `MSB`
- bit `0` is the `LSB`

## Graphics And Screen Terms

| Term | Meaning |
| --- | --- |
| `screen RAM` | the 1000-byte page the VIC uses for text cells or cell metadata |
| `color RAM` | the special 4-bit-per-cell color memory at `$d800-$dbff` |
| `bitmap mode` | graphics mode where pixel patterns are stored in bitmap memory |
| `sprite` | a hardware-movable graphic object drawn by the VIC-II |
| `character ROM` | ROM containing built-in character glyph bitmaps |
| `glyph` | the pixel shape of a character or symbol |
| `screen code` | the code stored in screen RAM to select a displayed character |
| `PETSCII` | Commodore’s character encoding, similar in concept to ASCII but different in values and behavior |
| `nibble` | 4 bits, or half of a byte |
| `upper nibble` | the high 4 bits of a byte, bits `7-4` |
| `lower nibble` | the low 4 bits of a byte, bits `3-0` |
| `FG` | foreground |
| `BG` | background |

## File And Disk Terms

| Term | Meaning |
| --- | --- |
| `D64` | a disk-image format representing a Commodore 1541 floppy disk |
| `DOS` | disk operating system; in this context usually Commodore DOS behavior on the drive |
| `BAM` | Block Availability Map; the disk structure that tracks free/used sectors |
| `track` | one circular ring of sectors on the floppy |
| `sector` | one 256-byte disk block |
| `directory entry` | a 32-byte file entry in the disk directory |
| `PRG` | Commodore file type for a program file, usually with a two-byte load address |
| `SEQ` | sequential file type |
| `USR` | user file type |
| `REL` | relative file type with side sectors |
| `load address` | the first two data bytes of a PRG file telling the C64 where to place it in memory |

## Cartridge And Expansion Terms

| Term | Meaning |
| --- | --- |
| `ROML` | low cartridge ROM area, typically `$8000-$9fff` |
| `ROMH` | high cartridge ROM area, often `$a000-$bfff` depending on mapping mode |
| `IO1` | cartridge / expansion I/O area at `$de00-$deff` |
| `IO2` | cartridge / expansion I/O area at `$df00-$dfff` |
| `GAME` | cartridge control line involved in memory mapping |
| `EXROM` | cartridge control line involved in memory mapping |
| `Ultimax` | a special cartridge memory configuration mode |
| `REU` | RAM Expansion Unit |

## KERNAL And I/O Terms

| Term | Meaning |
| --- | --- |
| `IEC` | Commodore serial bus used by devices like the 1541 |
| `SETNAM` | KERNAL routine to set filename and filename pointer |
| `SETLFS` | KERNAL routine to set logical file, device, and secondary address |
| `OPEN` | KERNAL routine to open a logical file |
| `CLOSE` | KERNAL routine to close a logical file |
| `CHKIN` | KERNAL routine to make a file the current input channel |
| `CHKOUT` | KERNAL routine to make a file the current output channel |
| `CLRCHN` | KERNAL routine to restore default channels |
| `CHRIN` | KERNAL routine to read one byte from the current input |
| `CHROUT` | KERNAL routine to write one byte to the current output |
| `GETIN` | KERNAL routine to get a buffered input character |
| `SCNKEY` | KERNAL routine to scan the keyboard |
| `READST` | KERNAL routine to read device/file status |
| `LOAD` | KERNAL routine to load a file |
| `SAVE` | KERNAL routine to save a file |
| `PLOT` | KERNAL routine to read or set cursor position |
| `STOP` | KERNAL routine to test stop-key state |

## Assembly And 6502 Terms

| Term | Meaning |
| --- | --- |
| `zero page` | addresses `$0000-$00ff`; special because many instructions are shorter/faster there |
| `stack` | page `$0100-$01ff`, used for returns, pushes, pulls, and interrupts |
| `opcode` | the instruction byte that tells the CPU what operation to perform |
| `operand` | extra byte or bytes after the opcode that the instruction uses |
| `immediate` | addressing mode where the value is embedded directly in the instruction |
| `absolute` | addressing mode using a full 16-bit address |
| `indexed` | addressing mode using a base address plus `X` or `Y` |
| `self-modifying code` | machine language that rewrites part of its own instructions at runtime |
| `JSR` | jump to subroutine |
| `RTS` | return from subroutine |
| `RTI` | return from interrupt |
| `SYS` | BASIC command that jumps into machine language at a specified address |
| `PEEK` | BASIC command to read a byte from memory |
| `POKE` | BASIC command to write a byte to memory |

## Tiny Pockets Press Export Terms

| Term | Meaning |
| --- | --- |
| `IDX` | the compact index file describing where tagged content lives |
| `DAT` | fixed-record-size data files referenced by the index |
| `BOOK.IDX` | the main exported index file |
| `BOOK.PRG` | BASIC-facing boot/reader program |
| `LOADER.PRG` | machine-language loader module |
| `HOM` | home-screen metadata tag |
| `TOC` | table-of-contents tag |
| `COV` | cover-image tag |
| `PAG` | graphic page tag |
| `ANK` | “any key” prompt tag |
| `BAK` | back-navigation prompt tag |
| `ESC` | home/escape prompt tag |
| `NXT` | next-page prompt tag |
| `DSK` | disk-identity tag in the index |
| `TAG` | sentinel / tag-head helper record in the index |

## UI And General Software Terms

| Term | Meaning |
| --- | --- |
| `UI` | user interface |
| `bootstrap` | a small initial loader whose only job is to load or start the larger program |
| `buffer` | temporary storage area |
| `staging` | temporarily placing data somewhere before moving or processing it |
| `overlay` | code or data that shares an address range with something else at a different time |

## Practical Reading Tips

When reading C64 material, these categories help:

- if it sounds like hardware, it is often a chip acronym like `SID`, `VIC-II`, or `CIA`
- if it sounds like a file suffix or disk structure, it is often a DOS or D64 term like `PRG`, `SEQ`, `BAM`, or `sector`
- if it sounds like a short all-caps routine name, it is often a KERNAL routine like `SETNAM`, `CHRIN`, or `LOAD`
- if it sounds like a three-letter project tag, it is probably one of the Tiny Pockets Press `IDX` tags like `HOM`, `TOC`, or `PAG`
