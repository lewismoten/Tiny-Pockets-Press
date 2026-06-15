# Memory Techniques: Advanced Use

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

## Advanced Banking And Overlay Techniques

### RAM Under ROM

Classic technique:

1. write data into a region currently showing ROM
2. bank the ROM out
3. read or execute the hidden RAM
4. bank the ROM back in when needed

Common targets:

- `$a000-$bfff`
- `$d000-$dfff`
- `$e000-$ffff`

### Character ROM Inspection

Common trick:

1. bank out I/O
2. expose character ROM at `$d000-$dfff`
3. copy glyph bytes into RAM
4. restore the previous bank

### Overlay Code

Instead of keeping all code visible at once, advanced programs often:

- keep one permanent control stub
- swap in different data or code chunks as needed

## Professional / Squeeze-Every-Byte Techniques

### Dual-Purpose Memory

One region may serve more than one role at different times:

- load buffer first
- decompression output later
- runtime workspace after that

### Self-Modifying Code

Common ML technique:

- patch operands at runtime
- avoid slower general logic
- reuse the same instruction stream for many destinations

### Reusing Screen Or Bitmap Memory Temporarily

Professional code often borrows visible memory briefly:

- build tables in screen RAM before display starts
- use bitmap memory as a buffer before graphics are shown
- use hidden or off-screen pages as temporary work RAM

### Streaming / Rolling Buffers

Instead of storing everything at once:

- keep a narrow buffer
- refill it continuously
- copy or render progressively

### Interrupt-Aware Banking

Advanced code that banks ROM or I/O in and out often also:

- disables interrupts briefly
- installs custom IRQ handlers
- carefully restores visible state before returning to KERNAL/BASIC code

### Cartridge And Expansion Exploits

More advanced setups may also use:

- cartridge ROM space
- cartridge I/O space
- REU-style expanded workflows
- custom hardware mapped through `IO1` or `IO2`

## Related Pages

- [techniques-safe-areas.md](techniques-safe-areas.md)
- [techniques-ml-only.md](techniques-ml-only.md)
- [../notes/banking.md](../notes/banking.md)
