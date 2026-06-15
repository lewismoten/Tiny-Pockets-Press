# 6502 Additional Instructions

Parent pages: [Notes Index](README.md), [6502.md](6502.md), [C64 README](../README.md)

These are standard 6502 instructions that are useful to know even though the current
loader does not rely on them heavily.

## Register Transfer And Stack Helpers

| Mnemonic | Common form | Opcode | Operand bytes after opcode | Total bytes | Meaning |
| --- | --- | --- | --- | --- | --- |
| `TAX` | `TAX` | `$aa` | `0` | `1` | A to X |
| `TAY` | `TAY` | `$a8` | `0` | `1` | A to Y |
| `TSX` | `TSX` | `$ba` | `0` | `1` | stack pointer to X |
| `TXA` | `TXA` | `$8a` | `0` | `1` | X to A |
| `TXS` | `TXS` | `$9a` | `0` | `1` | X to stack pointer |
| `TYA` | `TYA` | `$98` | `0` | `1` | Y to A |

## Compare, Bit, And Control

| Mnemonic | Common form | Opcode | Operand bytes after opcode | Total bytes | Meaning |
| --- | --- | --- | --- | --- | --- |
| `BIT` | `BIT $nnnn` | `$2c` | `2` | `3` | test bits and flags |
| `CPX` | `CPX #$nn` | `$e0` | `1` | `2` | compare X |
| `CPY` | `CPY #$nn` | `$c0` | `1` | `2` | compare Y |
| `BRK` | `BRK` | `$00` | `0` | `1` | software interrupt / break |
| `RTI` | `RTI` | `$40` | `0` | `1` | return from interrupt |
| `PHP` | `PHP` | `$08` | `0` | `1` | push processor status |
| `PLP` | `PLP` | `$28` | `0` | `1` | pull processor status |
| `NOP` | `NOP` | `$ea` | `0` | `1` | no operation |

## Decimal, Interrupt, And Overflow Control

| Mnemonic | Common form | Opcode | Operand bytes after opcode | Total bytes | Meaning |
| --- | --- | --- | --- | --- | --- |
| `CLD` | `CLD` | `$d8` | `0` | `1` | clear decimal mode |
| `SED` | `SED` | `$f8` | `0` | `1` | set decimal mode |
| `CLI` | `CLI` | `$58` | `0` | `1` | enable maskable interrupts |
| `SEI` | `SEI` | `$78` | `0` | `1` | disable maskable interrupts |
| `CLV` | `CLV` | `$b8` | `0` | `1` | clear overflow flag |
| `BVC` | `BVC label` | `$50` | `1` | `2` | branch if overflow clear |
| `BVS` | `BVS label` | `$70` | `1` | `2` | branch if overflow set |

## Related Pages

- [6502-instructions-used.md](6502-instructions-used.md)
- [6502-reference.md](6502-reference.md)
