# BASIC V2 File I/O And Flow Control

Parent pages: [BASIC Programming](basic-v2-programming.md), [BASIC V2](basic-v2.md), [Notes Index](README.md)

This page covers the statements we use most often for device access, dispatch, loops, and
embedded constant data.

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

## Related Notes

- [basic-v2-data-types.md](basic-v2-data-types.md)
- [basic-v2-errors-and-guidance.md](basic-v2-errors-and-guidance.md)
- [basic-v2-tokens-used.md](basic-v2-tokens-used.md)
