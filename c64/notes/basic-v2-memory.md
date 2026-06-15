# BASIC V2 Memory And System Variables

This page focuses on the RAM structures and system variables that matter when BASIC
shares memory with generated data or machine-language routines.

## BASIC Start And Core Pointers

| Address | Meaning |
| --- | --- |
| `$002b-$002c` | start of BASIC program text (`TXTTAB`) |
| `$002d-$002e` | start of variables (`VARTAB`) |
| `$002f-$0030` | start of arrays (`ARYTAB`) |
| `$0031-$0032` | end of arrays / start of free string area (`STREND`) |
| `$0033-$0034` | current string space top (`FRETOP`) |
| `$0035-$0036` | string utility pointer (`FRESPC`) |
| `$0037-$0038` | highest BASIC address used / memory limit (`MEMSIZ`) |
| `$0039-$003a` | current BASIC line number while executing (`CURLIN`) |
| `$003b-$003c` | current BASIC text pointer (`OLDTXT`) |
| `$00a0-$00a2` | BASIC temporary numeric workspace |
| `$00fb-$00fe` | common zero-page pointer area often reused by ML |
| `$0801` | default BASIC program start in RAM |

These pointers move as BASIC loads a program, creates variables, grows arrays, and
allocates strings.

## Memory Areas BASIC Normally Uses

| Range | Meaning |
| --- | --- |
| `$0801-$9fff` | BASIC program text, variables, arrays, string space, depending on memory size |
| `$0801-...` | tokenized BASIC lines |
| `VARTAB-ARYTAB` | scalar variables |
| `ARYTAB-STREND` | arrays |
| `FRETOP` downward | temporary strings and string heap |
| `$0100-$01ff` | 6502 hardware stack, also affected by `GOSUB`/`RETURN` and `FOR`/`NEXT` |

If you are mixing BASIC and machine language, you need to know where BASIC believes
its memory boundaries are, or BASIC will eventually overwrite your data.

## Common BASIC System Variables

These are the ones most likely to matter while writing generated BASIC or interop code.

| Address | Name | Meaning |
| --- | --- | --- |
| `$0013` | `STATUS` copy area | often inspected after I/O or KERNAL calls |
| `$0090` | `ST` | KERNAL serial/file I/O status byte |
| `$00c6` | keyboard buffer count | nonzero means keys are waiting |
| `$0277-$0280` | keyboard buffer | queued key codes |
| `$00d3-$00d6` | cursor / line editor state | screen editor internals |
| `$00ae-$00af` | `TI$` / clock support | timer support used by BASIC time functions |
| `$0300-$0333` | KERNAL vectors | indirect jump targets used by ROM |

## PEEK, POKE, And SYS

These are the core interop tools between BASIC and the machine.

### `PEEK`

Reads a byte from memory.

```basic
S=PEEK(144)
```

Here `144` decimal is `$0090`, the KERNAL status byte.

### `POKE`

Writes a byte to memory.

```basic
POKE 53280,0
POKE 53281,0
```

That sets border and background to black.

### `SYS`

Calls machine language at an address.

```basic
SYS 49152
```

This jumps to `$c000`.

## Screen And Color Memory From BASIC

Common decimal addresses:

| Decimal | Hex | Meaning |
| --- | --- | --- |
| `1024` | `$0400` | default screen RAM |
| `55296` | `$d800` | color RAM |
| `53280` | `$d020` | border color register |
| `53281` | `$d021` | background color register |

Example:

```basic
POKE 1024,1
POKE 55296,7
```

That writes screen code `1` at the top-left cell and colors it yellow.
