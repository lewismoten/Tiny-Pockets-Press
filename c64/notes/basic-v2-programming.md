# BASIC V2 Programming Notes

This page covers day-to-day BASIC V2 programming behavior: variables, arrays, strings,
flow control, file I/O, and the practical traps that show up in generated code.

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
- range is limited to signed 16-bit integers

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

## File I/O Statements

These are the BASIC-side tools for device access.

### `OPEN`

```basic
OPEN 1,8,2,"BOOK.IDX,S,R"
```

Common parts:

- first number: logical file number
- second number: device number (`8` for disk drive)
- third number: secondary address
- final string: filename and mode

### `INPUT#`

```basic
INPUT#1,A$
```

Reads text-style data from an open file.

### `GET#`

```basic
GET#1,A$
```

Reads a single character from a file or channel.

### `PRINT#`

```basic
PRINT#1,"HELLO"
```

Writes text to a file or channel.

### `CLOSE`

```basic
CLOSE 1
```

Always close file numbers you opened.

## Flow Control Statements

### `GOTO`

```basic
IF A=0 THEN GOTO 500
```

### `GOSUB` / `RETURN`

```basic
GOSUB 1000
RETURN
```

If a `RETURN` is hit without a matching active `GOSUB`, BASIC throws:

- `RETURN WITHOUT GOSUB`

### `FOR` / `NEXT`

```basic
FOR I=0 TO 9
PRINT I
NEXT
```

### `IF ... THEN`

```basic
IF K$="Q" THEN GOTO 900
```

### `ON ... GOTO`

```basic
ON P GOTO 100,200,300
```

Useful for small menu dispatch tables.

## DATA, READ, RESTORE

Useful for generated constant tables.

```basic
READ A,B,C
DATA 10,20,30
```

`RESTORE` resets the `READ` pointer to the first `DATA` statement or a specific line.

```basic
RESTORE
```

Common failure:

- `?OUT OF DATA ERROR`

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
