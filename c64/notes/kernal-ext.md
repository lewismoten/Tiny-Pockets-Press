# C64 KERNAL Extension Notes

This file lists standard C64 KERNAL jump-table routines that are not currently used by the Tiny Pockets Press loader/reader, but may be useful later.

Parent pages: [Notes Index](README.md), [kernal.md](kernal.md), [C64 README](../README.md)

The routines already in active use are documented in [kernal.md](kernal.md). This companion file is the broader reference.

## Scope

These are the classic C64 KERNAL entry points most often documented through the `$ff81-$fff3` jump table area. They are grouped here by what they are generally used for.

Some of these are safer and more generally useful than others. A few are mostly relevant for:

- full machine initialization
- serial bus protocols
- tape/datasette access
- cursor or screen editor integration
- interrupt-sensitive work

## System Initialization And Vector Control

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `CINT` | `$ff81` | initialize screen editor and video defaults | `JSR $ff81` when you want the KERNAL to restore its normal text-screen environment |
| `IOINIT` | `$ff84` | initialize CIA, SID, VIC, and I/O defaults | `JSR $ff84` during low-level reset-style setup; use carefully because it can disturb custom display state |
| `RAMTAS` | `$ff87` | initialize RAM pointers, system areas, and some memory state | `JSR $ff87` only for startup/reset behavior, not mid-session page loading |
| `RESTOR` | `$ff8a` | restore default KERNAL vectors | `JSR $ff8a` if custom vectors were hooked and need to be reset |
| `VECTOR` | `$ff8d` | read or write KERNAL vectors through a table pointer | pass a pointer to a vector table in `X/Y`; use when intercepting standard KERNAL behavior |
| `SETMSG` | `$ff90` | enable or disable KERNAL messages | place message flags in `A`, then `JSR $ff90` to suppress or allow default status chatter |

### When these matter to this project

- `CINT` is useful if we ever want to cleanly return from bitmap mode to a standard text-mode UI without manually restoring every video register.
- `RESTOR` and `VECTOR` matter if the reader starts patching KERNAL vectors for a custom fast reader or output hook.
- `SETMSG` would help if future file operations trigger built-in messages we want hidden.

## Serial Bus Device Control

These are lower-level IEC serial bus routines. They matter when doing more custom device communication than the `OPEN` / `CHKIN` / `CHRIN` pattern.

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `SECOND` | `$ff93` | send secondary address after `LISTEN` | load `A` with secondary address, then `JSR $ff93` |
| `TKSA` | `$ff96` | send secondary address after `TALK` | load `A` with secondary address, then `JSR $ff96` |
| `ACPTR` | `$ffa5` | accept one byte from serial bus | call after device is talking; byte returns in `A` |
| `CIOUT` | `$ffa8` | send one byte to serial bus | load `A` with byte to send, then `JSR $ffa8` |
| `UNTLK` | `$ffab` | send untalk on the serial bus | `JSR $ffab` to stop current talker |
| `UNLSN` | `$ffae` | send unlisten on the serial bus | `JSR $ffae` to stop current listener |
| `LISTEN` | `$ffb1` | tell a device to listen | load `A` with device number, then `JSR $ffb1` |
| `TALK` | `$ffb4` | tell a device to talk | load `A` with device number, then `JSR $ffb4` |
| `READST` | `$ffb7` | read KERNAL I/O status byte | `JSR $ffb7`, then check `A` for timeout, EOF, or device status flags |

### When these matter to this project

- If we move beyond byte-stream file reads and start talking more directly to the drive, these are the routines that become relevant.
- `READST` is especially useful for richer error handling and progress-state checks.
- A future custom reader might use `LISTEN`, `TALK`, `CIOUT`, and `ACPTR` to gain finer control over device conversation state.

## Output Channel And Character Output

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `CHKOUT` | `$ffc9` | make a logical file the current output channel | load `X` with logical file number, then `JSR $ffc9` |
| `CHROUT` | `$ffd2` | write one character to current output | load `A` with PETSCII byte, then `JSR $ffd2` |

### When these matter to this project

- `CHROUT` is the simplest way to print text from assembly.
- `CHKOUT` plus `CHROUT` would be handy if we ever emit structured text directly from ML instead of returning control to BASIC.
- If we want ML-driven loaders to write status lines, spinners, or progress text in text mode, `CHROUT` is one of the first routines to consider.

## File Save And Channel Cleanup

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `SAVE` | `$ffd8` | save a memory range to device | prepare file settings and address pointers, then `JSR $ffd8` |
| `CLALL` | `$ffe7` | close all files and clear channels | `JSR $ffe7` when you want a global cleanup rather than closing one file |

### When these matter to this project

- `SAVE` may matter if the reader ever writes bookmarks, reading position, or generated cache files.
- `CLALL` is useful for full recovery after a failed load sequence.

## Time, Jiffy Clock, And Polling

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `SETTIM` | `$ffdb` | set the system jiffy clock | put new time bytes in `A/X/Y`, then `JSR $ffdb` |
| `RDTIM` | `$ffde` | read the system jiffy clock | `JSR $ffde`, then read time bytes from `A/X/Y` |
| `STOP` | `$ffe1` | test the stop key | `JSR $ffe1`; carry typically indicates stop requested |
| `UDTIM` | `$ffea` | update the jiffy clock | normally IRQ-driven; manual calls are uncommon |

### When these matter to this project

- `RDTIM` is useful if we want delays or prompt timeouts without raster-spin loops.
- `STOP` could provide a second user interrupt path in long ML operations.
- `SETTIM` and `UDTIM` are less likely to be directly useful unless the reader begins relying on timekeeping behavior.

## Screen, Cursor, And Text Layout Helpers

| Routine | Address | What it does | How to use it |
| --- | --- | --- | --- |
| `SCREEN` | `$ffed` | report screen size | `JSR $ffed`, then use returned values to learn screen dimensions |
| `PLOT` | `$fff0` | read or set cursor position | use carry to select read vs write mode, then pass row/column in registers |
| `IOBASE` | `$fff3` | return CIA I/O base address | `JSR $fff3`, then use returned registers to discover base address |

### When these matter to this project

- `PLOT` is very useful if ML ever needs to place text at exact text-screen coordinates.
- `SCREEN` is less critical on a stock C64, but still good defensive infrastructure.
- `IOBASE` is mainly useful for low-level portability and introspection.

## Tape / Datasette Related Routines

Some KERNAL workflows around `LOAD` and `SAVE` also cover tape usage, but if this project ever wants explicit datasette behavior, the higher-level KERNAL path usually matters more than a direct drive-style one.

For now:

- `LOAD`
- `SAVE`
- `SETLFS`
- `SETNAM`

are the main practical KERNAL layer to know, and they are already documented in [kernal.md](kernal.md).

## Practical Advice For This Project

### Good candidates for future use

- `CHROUT`: ML-driven text and status display
- `READST`: better IO error reporting
- `RDTIM`: non-blocking time-based prompts
- `PLOT`: cursor positioning in ML text screens
- `STOP`: user interrupt support
- `SETMSG`: suppress KERNAL chatter when needed

### Use with caution

- `IOINIT`
- `RAMTAS`
- `CINT`
- `RESTOR`
- `VECTOR`

These are more “system state” routines than “do one file task” routines. They are powerful, but easy to misuse in the middle of a custom reader flow.

## Related Notes

- [kernal.md](kernal.md)
- [6502.md](6502.md)
- [../book-reader.md](../book-reader.md)
