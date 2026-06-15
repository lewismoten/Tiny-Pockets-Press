# BASIC V2 Overview

This page introduces Commodore 64 BASIC V2 at a high level and explains why this
project still uses it even though most performance-sensitive work moves into machine
language.

## What BASIC V2 Is Good At

- bootstrapping a program from `LOAD`/`RUN`
- simple menus and text UI
- orchestration around machine-language routines
- light file control through `OPEN`, `INPUT#`, `PRINT#`, and `CLOSE`
- quick experimentation with `PEEK`, `POKE`, and `SYS`

## What BASIC V2 Is Bad At

- tight byte-by-byte loops over large buffers
- frequent string slicing and concatenation
- complex parsing
- deep control flow
- large arrays unless carefully planned

That is why this project keeps pushing the heavy lifting into machine language while
leaving BASIC to handle startup, simple state, and user interaction.

## BASIC Program Layout

Each BASIC line in memory is stored as:

1. pointer to the next BASIC line: `2` bytes, little-endian
2. line number: `2` bytes, little-endian
3. tokenized BASIC text
4. line terminator: `00`

The final line is followed by a null next-line pointer `00 00`.

That is why a valid BASIC program binary cannot just be plain text. It must contain
the linked-line structure and tokenized keywords.

## BASIC And Machine Language In This Project

The normal pattern is:

1. BASIC prepares configuration or state bytes with `POKE`
2. BASIC calls ML with `SYS`
3. ML does the expensive work
4. BASIC reads back status bytes or buffers and decides what to do next

Example:

```basic
10 POKE 49152,8
20 POKE 49153,1
30 SYS 49320
40 IF PEEK(144)<>0 THEN PRINT "LOAD ERROR"
```

## Next Pages

- [basic-v2-memory.md](basic-v2-memory.md)
- [basic-v2-programming.md](basic-v2-programming.md)
- [basic-v2-tokens.md](basic-v2-tokens.md)
