# C64 KERNAL Notes

These are the KERNAL routines currently relevant to the reader/loader flow.

Parent pages: [Notes Index](README.md), [C64 README](../README.md)

For other standard KERNAL jump-table routines that are not currently used by this project, see [kernal-ext.md](kernal-ext.md).

## File IO Routines

| Routine | Address | Use |
| --- | --- | --- |
| `SETLFS` | `$ffba` | logical file/device/secondary address |
| `SETNAM` | `$ffbd` | filename pointer and length |
| `OPEN` | `$ffc0` | open a logical file |
| `CLOSE` | `$ffc3` | close a logical file |
| `CHKIN` | `$ffc6` | make logical file current input |
| `CLRCHN` | `$ffcc` | restore default I/O channels |
| `CHRIN` | `$ffcf` | read one byte from current input |
| `LOAD` | `$ffd5` | load a file into memory |

## Keyboard Routines

| Routine | Address | Use |
| --- | --- | --- |
| `SCNKEY` | `$ff9f` | scan keyboard matrix |
| `GETIN` | `$ffe4` | get buffered key |

## Practical Expectations

### `SETNAM`

- `A` = filename length
- `X/Y` = pointer to filename string

### `SETLFS`

- `A` = logical file number
- `X` = device number
- `Y` = secondary address

For disk drive 1541 usage, device `8` is the common default.

### `OPEN`

- opens the logical file
- carry set indicates failure

### `CHKIN`

- selects the file for input
- after this, `CHRIN` reads from that file

### `CHRIN`

- returns next byte in `A`
- file status is also reflected through the status area used by KERNAL, including `$90`

### `CLRCHN`

- always call to restore standard input/output after redirected IO

## Why The Loader Uses KERNAL

The current ML code relies on KERNAL because it is much simpler than writing a full custom 1541 fast loader. It keeps the custom assembly focused on:

- stream control
- pointer math
- buffer copying
- screen updates

If speed becomes the dominant issue later, this is the main area to revisit.

## Related Notes

- [kernal-ext.md](kernal-ext.md)
- [6502.md](6502.md)
- [../assembly-programs.md](../assembly-programs.md)
