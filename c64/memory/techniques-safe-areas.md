# Memory Techniques: Safe And Common Areas

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

## Safe Starter Areas

### `C000-CFFF`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$c000-$cfff` | `4096` bytes | simple, contiguous RAM area, rarely occupied by BASIC itself |

Typical uses:

- machine-language routines
- loaders
- decompression code
- staging buffers

### BASIC Program Area Above `$0801`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$0801` upward | dynamic | natural place for BASIC loaders and mixed BASIC/ML programs |

Caution:

- BASIC program text, variables, arrays, and strings all grow through this region
- you must know where BASIC memory currently ends before placing permanent ML there

### Screen Memory At `$0400-$07ff`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$0400-$07ff` | `1024` bytes | normal/default text screen page, easy to inspect |

Important nuance:

- `$0400-$07ff` is the normal screen page, not the only possible one
- the VIC can be pointed at a different screen-memory page by changing `$d018`

### When Screen Memory Becomes Reusable

The right question is:

- where is the active screen page for the current VIC setup?

For this project’s current bitmap setup, the active screen page is intentionally moved
to `$6000-$63ff`, so `$0400-$07ff` is more reusable than it would be in a normal text
screen program.

## Additional Areas People Commonly Use

### Lower Main RAM Buffers

| Range | Typical use |
| --- | --- |
| `$0334-$03ff` | extra vectors, stubs, small data, depending on program discipline |
| `$0800-$9fff` | code, buffers, packed assets, tables |

### High RAM Under BASIC ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$a000-$bfff` | `8192` bytes | RAM exists underneath BASIC ROM |

### High RAM Under KERNAL ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$e000-$ffff` | `8192` bytes | RAM exists underneath KERNAL ROM |

### RAM Under I/O

| Range | Length | Notes |
| --- | --- | --- |
| `$d000-$dfff` | `4096` bytes | RAM exists underneath I/O / character ROM |

## Tiny Scratch Areas That Are Often “Safe Enough”

### A Few Zero-Page Bytes

Programs often borrow a couple of zero-page bytes for pointers if they save and
restore them carefully.

### Spare Trailing Bytes In Reserved Pages

Partially used pages sometimes donate a few bytes for flags or counters.

### Invisible Or Non-Displayed Screen Tail Bytes

The text screen uses 1000 bytes in a 1024-byte page, so the tail sometimes gets used
for tiny flags or pointers in carefully documented projects.

## Related Pages

- [techniques-advanced.md](techniques-advanced.md)
- [techniques-ml-only.md](techniques-ml-only.md)
- [../memory-techniques.md](../memory-techniques.md)
