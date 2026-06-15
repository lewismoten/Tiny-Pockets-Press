# BASIC V2 Errors And Practical Guidance

Parent pages: [BASIC Programming](basic-v2-programming.md), [BASIC V2](basic-v2.md), [Notes Index](README.md)

This page focuses on the errors we have already tripped over in this project and the
working habits that help generated BASIC stay stable.

## Error Messages We Have Hit

| Error | Typical Cause |
| --- | --- |
| `?SYNTAX ERROR` | malformed generated line, bad quotes, invalid token order |
| `?ILLEGAL QUANTITY ERROR` | invalid argument to math, array, string, or screen operations |
| `?UNDEF'D STATEMENT ERROR` | `GOTO`/`GOSUB` target missing |
| `RETURN WITHOUT GOSUB` | `RETURN` reached without active `GOSUB` |
| `?BAD SUBSCRIPT ERROR` | array index outside declared bounds |
| `?OUT OF DATA ERROR` | `READ` exceeded generated `DATA` statements |
| `?REDIM'D ARRAY ERROR` | attempted to re-`DIM` an existing array |
| `?TYPE MISMATCH ERROR` | mixed string/numeric use incorrectly |
| `?OVERFLOW ERROR` | arithmetic result outside BASIC’s supported range |

## Practical Guidance For Generated BASIC

- keep line construction simple
- prefer short variable names
- remember only the first two characters of a variable name are significant
- keep string expressions short
- avoid repeated concatenation inside large loops
- verify every `GOSUB` has a reachable `RETURN`
- reserve arrays once and reuse them
- prefer ML for large file reads, decompression, rendering, or bitmap copies
- use `POKE`/`SYS`/status bytes as the contract between BASIC and ML

## Related Notes

- [basic-v2-file-io-and-flow.md](basic-v2-file-io-and-flow.md)
- [basic-v2-memory.md](basic-v2-memory.md)
- [6502.md](6502.md)
