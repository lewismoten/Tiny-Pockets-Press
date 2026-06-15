# Memory Techniques: ML-Only Reclamation

Parent pages: [Memory Docs](README.md), [C64 README](../README.md)

## Reclaiming BASIC-Related RAM For ML-Only Programs

This is the point where many projects stop trying to coexist with BASIC and start
treating it as launch scaffolding only.

## BASIC As A Bootstrap Only

Very common pattern:

1. small BASIC stub loads the program
2. BASIC executes `SYS ...`
3. machine language takes over
4. BASIC variables and symbols are no longer needed

## Reclaimable BASIC-Oriented Areas

Depending on program design, people often reclaim:

- BASIC program text area
- BASIC variable area
- array/string space
- RAM under BASIC ROM

## Common ML-Only Mindset

After the handoff:

- do not return to interpreted BASIC logic
- do not depend on BASIC symbols remaining valid
- treat the machine as an ML runtime with optional KERNAL access

## Last Step: Writing Over BASIC-Owned RAM

If your program is truly ML-only after startup, you can often overwrite RAM that BASIC
would otherwise care about, because BASIC is no longer the active owner of that
memory.

That includes, depending on the design:

- former BASIC text/program space
- variable storage
- array storage
- string storage

## Recommended Escalation Path

1. start in `$c000-$cfff`
2. add normal RAM buffers in obvious visible RAM
3. borrow a few well-documented zero-page bytes
4. use RAM under ROM only when you understand banking
5. use RAM under I/O only when you understand overlay risks
6. reclaim BASIC-owned RAM only once your program is truly ML-first

## Related Pages

- [techniques-safe-areas.md](techniques-safe-areas.md)
- [techniques-advanced.md](techniques-advanced.md)
- [../notes/basic-v2-memory.md](../notes/basic-v2-memory.md)
