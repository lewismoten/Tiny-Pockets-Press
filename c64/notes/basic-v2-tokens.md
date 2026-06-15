# BASIC V2 Tokens

This page focuses only on tokenized BASIC program text: what the keyword bytes are,
which ones this project uses often, and the full standard BASIC V2 token list.

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

## Full BASIC V2 Token Reference

This appendix lists the standard Commodore 64 BASIC V2 token bytes in token order.

| Token | Keyword / Meaning |
| --- | --- |
| `$80` | `END` |
| `$81` | `FOR` |
| `$82` | `NEXT` |
| `$83` | `DATA` |
| `$84` | `INPUT#` |
| `$85` | `INPUT` |
| `$86` | `DIM` |
| `$87` | `READ` |
| `$88` | `LET` |
| `$89` | `GOTO` |
| `$8A` | `RUN` |
| `$8B` | `IF` |
| `$8C` | `RESTORE` |
| `$8D` | `GOSUB` |
| `$8E` | `RETURN` |
| `$8F` | `REM` |
| `$90` | `STOP` |
| `$91` | `ON` |
| `$92` | `WAIT` |
| `$93` | `LOAD` |
| `$94` | `SAVE` |
| `$95` | `VERIFY` |
| `$96` | `DEF` |
| `$97` | `POKE` |
| `$98` | `PRINT#` |
| `$99` | `PRINT` |
| `$9A` | `CONT` |
| `$9B` | `LIST` |
| `$9C` | `CLR` |
| `$9D` | `CMD` |
| `$9E` | `SYS` |
| `$9F` | `OPEN` |
| `$A0` | `CLOSE` |
| `$A1` | `GET` |
| `$A2` | `NEW` |
| `$A3` | `TAB(` |
| `$A4` | `TO` |
| `$A5` | `FN` |
| `$A6` | `SPC(` |
| `$A7` | `THEN` |
| `$A8` | `NOT` |
| `$A9` | `STEP` |
| `$AA` | `+` |
| `$AB` | `-` |
| `$AC` | `*` |
| `$AD` | `/` |
| `$AE` | `^` |
| `$AF` | `AND` |
| `$B0` | `OR` |
| `$B1` | `>` |
| `$B2` | `=` |
| `$B3` | `<` |
| `$B4` | `SGN` |
| `$B5` | `INT` |
| `$B6` | `ABS` |
| `$B7` | `USR` |
| `$B8` | `FRE` |
| `$B9` | `POS` |
| `$BA` | `SQR` |
| `$BB` | `RND` |
| `$BC` | `LOG` |
| `$BD` | `EXP` |
| `$BE` | `COS` |
| `$BF` | `SIN` |
| `$C0` | `TAN` |
| `$C1` | `ATN` |
| `$C2` | `PEEK` |
| `$C3` | `LEN` |
| `$C4` | `STR$` |
| `$C5` | `VAL` |
| `$C6` | `ASC` |
| `$C7` | `CHR$` |
| `$C8` | `LEFT$` |
| `$C9` | `RIGHT$` |
| `$CA` | `MID$` |
| `$CB` | `GO` |

## Token Notes

- `GO` at `$CB` is part of BASIC’s token grammar and appears in tokenized text even
  though source code is written as `GOTO` or `GOSUB`
- operators such as `+`, `-`, `*`, `/`, `AND`, and `OR` are also tokenized
- plain variable names, numeric literals, commas, parentheses, colons, and quotes are
  still stored as regular character bytes rather than keyword tokens
- after a `REM` token, the rest of the line is treated as literal text rather than
  parsed as more tokens
