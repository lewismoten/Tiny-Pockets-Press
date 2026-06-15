# BASIC V2 Data Types And Strings

Parent pages: [BASIC Programming](basic-v2-programming.md), [BASIC V2](basic-v2.md), [Notes Index](README.md)

This page covers variables, arrays, and string behavior in BASIC V2.

## Variable Naming Rules

- numeric variables default to floating point
- integer variables end in `%`
- string variables end in `$`
- array names follow the same suffix rules
- only the first two characters are significant for variable identity in classic BASIC

Examples:

```basic
A=1
AB=2
ABC=3
```

`AB` and `ABC` refer to the same variable name to BASIC’s symbol logic. That is why
generated code should keep names short and intentional.

## Scalar Variable Types

| Form | Type | Example |
| --- | --- | --- |
| `A` | floating point | `A=3.14` |
| `A%` | integer | `A%=42` |
| `A$` | string | `A$="BOOK"` |

### Floating Point

- default numeric type
- flexible but slow
- good for general math

```basic
X=10
Y=X/3
```

### Integer

- faster than floating point for many operations
- range is limited to signed `16`-bit integers

```basic
I%=10
I%=I%+1
```

### String

- stores a descriptor in variable space
- actual character data lives elsewhere in string memory

```basic
TITLE$="TINY POCKETS PRESS"
```

## Arrays

Arrays must be dimensioned before use.

```basic
DIM A%(10)
DIM N$(9)
```

Important rules:

- arrays cannot be re-`DIM`'d once created
- index ranges are inclusive
- BASIC defaults array lower bounds to `0`
- multi-dimensional arrays are allowed but expensive

Example:

```basic
DIM PAGE%(255)
FOR I=0 TO 255
PAGE%(I)=0
NEXT
```

## Strings And String Memory

Strings are one of the trickiest parts of BASIC V2 memory behavior.

- string variables store descriptors, not inline text
- temporary string expressions create garbage in string space
- `MID$`, `LEFT$`, concatenation, and repeated `CHR$` use can fragment memory

Useful functions:

| Function | Meaning |
| --- | --- |
| `CHR$(n)` | make a one-character string from byte `n` |
| `ASC(s$)` | get code of first character |
| `LEN(s$)` | string length |
| `LEFT$(s$,n)` | first `n` chars |
| `RIGHT$(s$,n)` | last `n` chars |
| `MID$(s$,p,n)` | substring |
| `VAL(s$)` | parse numeric string |
| `STR$(n)` | convert number to string |

Example:

```basic
A$=CHR$(147)+"HELLO"
L=LEN(A$)
C=ASC(MID$(A$,2,1))
```

## Related Notes

- [basic-v2-memory.md](basic-v2-memory.md)
- [basic-v2-file-io-and-flow.md](basic-v2-file-io-and-flow.md)
- [basic-v2-errors-and-guidance.md](basic-v2-errors-and-guidance.md)
