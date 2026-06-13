# Commodore 64 BASIC V2 Notes

## General Constraints

- no local variables
- arrays must be dimensioned before use
- line-number oriented flow
- string handling is expensive
- loops over lots of bytes are slow

## Common Error Messages We Have Hit

| Error | Typical Cause |
| --- | --- |
| `?SYNTAX ERROR` | malformed generated line |
| `?ILLEGAL QUANTITY ERROR` | invalid argument to math/string/array ops |
| `?UNDEF'D STATEMENT ERROR` | `GOTO`/`GOSUB` target missing |
| `RETURN WITHOUT GOSUB` | `RETURN` reached without active `GOSUB` |
| `?BAD SUBSCRIPT ERROR` | array index outside declared bounds |
| `?OUT OF DATA ERROR` | `READ` exceeded generated `DATA` statements |
| `?REDIM'D ARRAY ERROR` | attempted to re-`DIM` an existing array |

## String/Character Helpers

- `CHR$(n)`: make a one-character string from byte `n`
- `ASC(s$)`: get code of first char
- `MID$`, `LEFT$`, `RIGHT$`: substring helpers
- `LEN(s$)`: length
- `VAL(s$)`: parse numeric string

## PEEK/POKE

- `PEEK(addr)`: read byte from memory
- `POKE addr,value`: write byte to memory

These are heavily used for:

- reading loader status bytes
- setting loader configuration fields
- controlling VIC-II registers
- reading buffers filled by machine language

## Calling Machine Language

- `SYS address`

The BASIC program configures loader state with `POKE`, then `SYS` calls into ML.

## Practical Guidance For Generated BASIC

- keep line construction simple
- prefer short variable names
- be careful with quote escaping
- always verify every `GOSUB` has a matching reachable `RETURN`
- reserve arrays once and reuse them
- avoid deeply nested logic when a small helper subroutine will do
