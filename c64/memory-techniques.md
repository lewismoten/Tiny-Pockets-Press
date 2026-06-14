# C64 Memory Techniques

This file is a practical guide to how C64 programmers tend to grow into memory use.

It starts with conservative, beginner-safe areas, then moves toward more aggressive techniques:

1. safe starter areas
2. additional RAM commonly used by projects
3. advanced banking and overlay use
4. professional / squeeze-every-byte techniques
5. tiny “usually safe enough” scratch spots
6. reclaiming BASIC-related RAM when running machine language only

This is not a promise that every byte is always free in every program. It is a guide to common practice.

For the full address-space map, see [memory-map.md](memory-map.md).

## 1. Safe Starter Areas

These are the places many people start because they are easy to reason about.

### `C000-CFFF`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$c000-$cfff` | `4096` bytes | simple, contiguous RAM area, rarely occupied by BASIC itself |

Why it is popular:

- easy to `SYS 49152`
- not covered by BASIC ROM or KERNAL ROM
- large enough for a lot of ML utilities
- easy to document and debug

Typical uses:

- machine-language routines
- loaders
- decompression code
- staging buffers

### BASIC Program Area Above `$0801`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$0801` upward | dynamic | natural place for BASIC loaders and mixed BASIC/ML programs |

Why it is popular:

- BASIC files already load here by default
- easy for small ML stubs embedded after BASIC lines
- works well for tokenized BASIC plus inline machine code

Caution:

- BASIC program text, variables, arrays, and strings all grow through this region
- you must know where BASIC memory currently ends before placing permanent ML there

### Screen Memory At `$0400-$07ff`

| Range | Length | Why people use it |
| --- | --- | --- |
| `$0400-$07ff` | `1024` bytes | normal/default text screen page, easy to inspect |

Why people use it:

- direct text-mode rendering
- simple UI and debugging output
- fast visual feedback

Why this range matters:

- it is the normal screen-memory location most people start with
- many BASIC and simple ML programs assume the visible screen page is here
- it is easy to inspect because writing bytes here usually changes visible text immediately

Important nuance:

- `$0400-$07ff` is the normal screen page, not the only possible one
- the VIC can be pointed at a different screen-memory page by changing the VIC memory-pointer setup, typically through register `$d018`

Caution:

- it is not “free RAM” if the screen is active
- writing here affects what the user sees

### When Screen Memory Becomes Reusable

The important idea is:

- “screen memory” means whichever 1 KB page the VIC is currently using as screen RAM
- that is not always `$0400-$07ff`

In ordinary text mode, the default visible screen page is usually:

- `$0400-$07ff`

So in that common case, `$0400-$07ff` is definitely in active use.

In bitmap mode, the VIC still needs a screen RAM page, because the bitmap pixels alone are not enough. The screen page provides per-cell information such as color nibbles.

That means bitmap mode does **not** automatically make `$0400-$07ff` free.

The right question is:

- where is the active screen page for the current VIC setup?

Examples:

- if the active screen page is still `$0400-$07ff`, then do not treat it as free
- if the active screen page has been moved to something like `$6000-$63ff`, then `$0400-$07ff` may become reusable

For this project’s current bitmap setup, the active screen page is intentionally moved away from `$0400` to:

- `$6000-$63ff`

So in this project, `$0400-$07ff` is generally more available than it would be in a normal text-screen program.

But the safe rule is always:

- only reuse a screen page after confirming the VIC is no longer pointing at it

## 2. Additional Areas People Commonly Use

Once people are comfortable, they often use more of main RAM intentionally.

### Lower Main RAM Buffers

| Range | Typical use |
| --- | --- |
| `$0334-$03ff` | extra vectors, stubs, small data, depending on program discipline |
| `$0800-$9fff` | code, buffers, packed assets, tables |

This is where a lot of real software lives:

- packed assets
- map data
- page buffers
- sprite data
- decompression output

The main issue is coexistence:

- with BASIC
- with screen memory
- with active buffers

### High RAM Under BASIC ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$a000-$bfff` | `8192` bytes | RAM exists underneath BASIC ROM |

Why people use it:

- valuable extra 8 KB
- often unused once a project is no longer relying on BASIC execution

Caution:

- normally reads as BASIC ROM until banking changes
- easier for ML-only or ML-heavy programs than for mixed BASIC tools

### High RAM Under KERNAL ROM

| Range | Length | Notes |
| --- | --- | --- |
| `$e000-$ffff` | `8192` bytes | RAM exists underneath KERNAL ROM |

Why people use it:

- large hidden area
- attractive for data, code, or private buffers

Caution:

- KERNAL usually needs to be visible for many standard routines
- interrupts and system calls complicate using this region

### RAM Under I/O

| Range | Length | Notes |
| --- | --- | --- |
| `$d000-$dfff` | `4096` bytes | RAM exists underneath I/O / character ROM |

Why people use it:

- extra hidden RAM
- good for tables, temporary storage, or code that runs with I/O banked out

Caution:

- if I/O is visible, you are not reading that RAM
- if character ROM is visible, you are not reading that RAM either
- interrupt-safe use takes more care

## 3. Advanced Banking And Overlay Techniques

This is where programmers stop thinking of addresses as fixed contents and start thinking in layers.

## RAM Under ROM

Classic technique:

1. write data into a region currently showing ROM
2. bank the ROM out
3. read or execute the hidden RAM
4. bank the ROM back in when needed

Common targets:

- `$a000-$bfff`
- `$d000-$dfff`
- `$e000-$ffff`

Typical uses:

- hidden code modules
- asset tables
- temporary buffers
- self-relocating routines

## Character ROM Inspection

A common advanced trick is:

1. bank out I/O
2. expose character ROM at `$d000-$dfff`
3. copy glyph bytes into RAM
4. restore the previous bank

Useful for:

- custom font conversion
- sprite generation
- text effects

## Overlay Code

Instead of keeping all code visible at once, advanced programs often:

- keep one permanent control stub
- swap in different data or code chunks as needed

Typical pattern:

- permanent controller in a safe RAM area like `$c000`
- working modules loaded into banked or reclaimed areas

## 4. Professional / Squeeze-Every-Byte Techniques

These are the kinds of tricks experienced demo, game, and loader programmers like to use.

## Dual-Purpose Memory

One region may serve more than one role at different times:

- load buffer first
- decompression output later
- runtime workspace after that

This works well when lifetimes do not overlap.

## Self-Modifying Code

Common ML technique:

- patch operands at runtime
- avoid slower general logic
- reuse the same instruction stream for many destinations

Typical examples:

- patching `LDA $xxxx`
- patching `STA $xxxx`
- patching branch destinations or loop limits

## Reusing Screen Or Bitmap Memory Temporarily

Professional code often borrows visible memory briefly:

- build tables in screen RAM before display starts
- use bitmap memory as a buffer before graphics are shown
- use hidden or off-screen pages as temporary work RAM

## Streaming / Rolling Buffers

Instead of storing everything at once:

- keep a narrow buffer
- refill it continuously
- copy or render progressively

This is the same family of technique used by this project’s loader when streaming image data.

## Interrupt-Aware Banking

Advanced code that banks ROM or I/O in and out often also:

- disables interrupts briefly
- installs custom IRQ handlers
- carefully restores visible state before returning to KERNAL/BASIC code

## Cartridge And Expansion Exploits

More advanced setups may also use:

- cartridge ROM space
- cartridge I/O space
- REU-style expanded workflows
- custom hardware mapped through `IO1` or `IO2`

That is outside stock-C64-only assumptions, but very common in serious tooling.

## 5. Tiny Scratch Areas That Are Often “Safe Enough”

This section is intentionally cautious.

These are not universal promises. They are small spots programmers often borrow when they know exactly what else is running.

## A Few Zero-Page Bytes

Many programs reserve a couple of zero-page bytes for pointers because it is so useful.

Typical pattern:

- choose a few bytes
- document them
- save/restore if sharing space with KERNAL or another routine

In this project, for example, the loader deliberately borrows:

- `$fb/$fc`
- `$fd/$fe`

and then restores them.

That is the right way to treat valuable bytes: borrowed, not assumed free forever.

## Spare Trailing Bytes In Reserved Pages

Sometimes a page is only partially used, and a few bytes near the end are borrowed for:

- flags
- counters
- tiny tables

Example mindset:

- “safe enough for this program”
- not “guaranteed free on every C64 program”

## Invisible Or Non-Displayed Screen Tail Bytes

For a visible 40x25 text screen:

- 1000 bytes are used for cells
- the screen page is 1024 bytes

That leaves a small tail in the page.

People sometimes borrow those bytes for tiny flags or pointers, but:

- it is a project-specific optimization
- it depends on screen layout assumptions
- it should be documented loudly

## Safe Rule For Scratch Bytes

If you only need:

- one flag
- one counter
- one pointer

then the safest habit is:

1. choose a byte explicitly
2. document it
3. save/restore if the system or another routine may care

## 6. Reclaiming BASIC-Related RAM For ML-Only Programs

This is the point where many projects stop trying to coexist with BASIC and start treating it as launch scaffolding only.

## BASIC As A Bootstrap Only

Very common pattern:

1. small BASIC stub loads the program
2. BASIC executes `SYS ...`
3. machine language takes over
4. BASIC variables and symbols are no longer needed

At that point, a lot of memory that BASIC normally uses becomes reclaimable in practice.

## Reclaimable BASIC-Oriented Areas

Depending on program design, people often reclaim:

- BASIC program text area
- BASIC variable area
- array/string space
- RAM under BASIC ROM

Once you no longer need BASIC to continue running meaningfully, those areas become much more attractive.

## Common ML-Only Mindset

After the handoff:

- do not return to interpreted BASIC logic
- do not depend on BASIC symbols remaining valid
- treat the machine as an ML runtime with optional KERNAL access

That is often the right model for:

- readers
- games
- demos
- custom loaders

## Last Step: Writing Over BASIC-Owned RAM

If your program is truly ML-only after startup, you can often overwrite RAM that BASIC would otherwise care about, because BASIC is no longer the active owner of that memory.

That includes, depending on the design:

- former BASIC text/program space
- variable storage
- array storage
- string storage

The key rule is simple:

- if BASIC still needs to run normally, do not destroy it
- if BASIC has handed off forever, reclaim aggressively and deliberately

## Recommended Escalation Path

If you are deciding how aggressive to be, a good progression is:

1. start in `$c000-$cfff`
2. add normal RAM buffers in obvious visible RAM
3. borrow a few well-documented zero-page bytes
4. use RAM under ROM only when you understand banking
5. use RAM under I/O only when you understand overlay risks
6. reclaim BASIC-owned RAM only once your program is truly ML-first

That progression keeps the early work understandable while leaving room to grow into more serious C64 techniques later.
