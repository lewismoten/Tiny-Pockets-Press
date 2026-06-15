# BASIC V2 Tokens In Practice

Parent pages: [BASIC Tokens](basic-v2-tokens.md), [BASIC V2](basic-v2.md), [Notes Index](README.md)

This page focuses on tokenized BASIC program text: what the keyword bytes are and which
ones this project uses or may use often.

## Token Basics

When a BASIC line is stored in memory or in a `.PRG`, most keywords are not plain text.
They are token bytes.

This matters because invalid token bytes lead to corrupted BASIC lines or unexpected
keywords when a generated `.PRG` is loaded.

## Common BASIC Tokens Used In This Project

| Keyword | Token byte |
| --- | --- |
| `END` | `$80` |
| `FOR` | `$81` |
| `NEXT` | `$82` |
| `DATA` | `$83` |
| `INPUT#` | `$84` |
| `INPUT` | `$85` |
| `DIM` | `$86` |
| `READ` | `$87` |
| `LET` | `$88` |
| `GOTO` | `$89` |
| `RUN` | `$8a` |
| `IF` | `$8b` |
| `RESTORE` | `$8c` |
| `GOSUB` | `$8d` |
| `RETURN` | `$8e` |
| `REM` | `$8f` |
| `STOP` | `$90` |
| `ON` | `$91` |
| `WAIT` | `$92` |
| `LOAD` | `$93` |
| `SAVE` | `$94` |
| `VERIFY` | `$95` |
| `DEF` | `$96` |
| `POKE` | `$97` |
| `PRINT#` | `$98` |
| `PRINT` | `$99` |
| `CONT` | `$9a` |
| `LIST` | `$9b` |
| `CLR` | `$9c` |
| `CMD` | `$9d` |
| `SYS` | `$9e` |
| `OPEN` | `$9f` |
| `CLOSE` | `$a0` |
| `GET` | `$a1` |
| `NEW` | `$a2` |

## Additional BASIC Tokens Not Currently Used In This Project

The table above focuses on keywords we have directly run into while building the
reader/export pipeline. BASIC V2 has many more built-in tokens that are useful to keep
around as a reference when experimenting or extending generated programs.

### More Statement / Command Tokens

| Keyword | Token byte |
| --- | --- |
| `TAB(` | `$a3` |
| `TO` | `$a4` |
| `FN` | `$a5` |
| `SPC(` | `$a6` |
| `THEN` | `$a7` |
| `NOT` | `$a8` |
| `STEP` | `$a9` |
| `+` | `$aa` |
| `-` | `$ab` |
| `*` | `$ac` |
| `/` | `$ad` |
| `^` | `$ae` |
| `AND` | `$af` |
| `OR` | `$b0` |
| `>` | `$b1` |
| `=` | `$b2` |
| `<` | `$b3` |

### Built-In Numeric / Math Functions

| Keyword | Token byte |
| --- | --- |
| `SGN` | `$b4` |
| `INT` | `$b5` |
| `ABS` | `$b6` |
| `USR` | `$b7` |
| `FRE` | `$b8` |
| `POS` | `$b9` |
| `SQR` | `$ba` |
| `RND` | `$bb` |
| `LOG` | `$bc` |
| `EXP` | `$bd` |
| `COS` | `$be` |
| `SIN` | `$bf` |
| `TAN` | `$c0` |
| `ATN` | `$c1` |

### String And Conversion Functions

| Keyword | Token byte |
| --- | --- |
| `PEEK` | `$c2` |
| `LEN` | `$c3` |
| `STR$` | `$c4` |
| `VAL` | `$c5` |
| `ASC` | `$c6` |
| `CHR$` | `$c7` |
| `LEFT$` | `$c8` |
| `RIGHT$` | `$c9` |
| `MID$` | `$ca` |

### System / Utility Functions

| Keyword | Token byte |
| --- | --- |
| `GO` | `$cb` |

`GO` is the token BASIC uses as part of `GO TO` and `GO SUB` parsing in tokenized
program text.

## Related Notes

- [basic-v2-tokens-reference.md](basic-v2-tokens-reference.md)
- [basic-v2-file-io-and-flow.md](basic-v2-file-io-and-flow.md)
- [basic-v2-memory.md](basic-v2-memory.md)
