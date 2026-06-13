# Generated Assembly Mirrors

This folder holds source-style assembly mirrors of the machine-language programs that are currently generated in JavaScript during C64 D64 export.

These files are not yet the authoritative build source. The authoritative logic still lives in [js/export.js](/Users/lewismoten/dev/Tiny%20Pockets%20Press/js/export.js), where bytes are emitted directly.

The purpose of this folder is to make that generated machine-language logic easier to:

- read
- review
- debug
- evolve into a future assembler-driven build pipeline

## Files

- [LOADER.asm](/Users/lewismoten/dev/Tiny%20Pockets%20Press/c64/ASM/LOADER.asm): main machine-language asset loader and generic record reader.
- [BOOTSTRAP.asm](/Users/lewismoten/dev/Tiny%20Pockets%20Press/c64/ASM/BOOTSTRAP.asm): small bootstrap that KERNAL-loads `LOADER.PRG`.

## Notes

- These files reflect the current generated behavior as closely as practical.
- Labels and comments were added to make the intent easier to follow than raw emitted bytes.
- Some generated data blobs, such as fallback prompt sprite bytes, are noted symbolically rather than fully expanded here.
- If the JS emitter changes, these files should be updated to match.
