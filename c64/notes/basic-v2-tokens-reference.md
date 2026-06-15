# Full BASIC V2 Token Reference

Parent pages: [BASIC Tokens](basic-v2-tokens.md), [Tokens In Practice](basic-v2-tokens-used.md), [BASIC V2](basic-v2.md)

This appendix lists the standard Commodore 64 BASIC V2 token bytes in token order.

## Full BASIC V2 Token Reference

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
