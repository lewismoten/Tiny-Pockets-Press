# 6502 Instructions Used In The Loader

Parent pages: [Notes Index](README.md), [6502.md](6502.md), [C64 README](../README.md)

This page keeps the “used in the loader” instruction set separate from the rest of the
6502 reference so it stays easy to scan while debugging current project code.

## Core Used Instructions

| Mnemonic | Common form | Opcode | Operand bytes after opcode | Total bytes | Meaning |
| --- | --- | --- | --- | --- | --- |
| `LDA` | `LDA #$nn` | `$a9` | `1` | `2` | load accumulator |
| `LDX` | `LDX #$nn` | `$a2` | `1` | `2` | load X |
| `LDY` | `LDY #$nn` | `$a0` | `1` | `2` | load Y |
| `STA` | `STA $nnnn` | `$8d` | `2` | `3` | store accumulator |
| `STX` | `STX $nnnn` | `$8e` | `2` | `3` | store X |
| `STY` | `STY $nnnn` | `$8c` | `2` | `3` | store Y |
| `ADC` | `ADC #$nn` | `$69` | `1` | `2` | add with carry |
| `SBC` | `SBC #$nn` | `$e9` | `1` | `2` | subtract with carry |
| `CMP` | `CMP $nnnn` | `$cd` | `2` | `3` | compare with A |
| `AND` | `AND #$nn` | `$29` | `1` | `2` | bitwise AND |
| `ORA` | `ORA #$nn` | `$09` | `1` | `2` | bitwise OR |
| `EOR` | `EOR #$nn` | `$49` | `1` | `2` | bitwise XOR |
| `INC` | `INC $nnnn` | `$ee` | `2` | `3` | increment memory |
| `DEC` | `DEC $nnnn` | `$ce` | `2` | `3` | decrement memory |
| `INX` | `INX` | `$e8` | `0` | `1` | increment X |
| `INY` | `INY` | `$c8` | `0` | `1` | increment Y |
| `DEX` | `DEX` | `$ca` | `0` | `1` | decrement X |
| `DEY` | `DEY` | `$88` | `0` | `1` | decrement Y |
| `ASL` | `ASL A` | `$0a` | `0` | `1` | shift left |
| `LSR` | `LSR A` | `$4a` | `0` | `1` | shift right |
| `ROL` | `ROL A` | `$2a` | `0` | `1` | rotate left through carry |
| `ROR` | `ROR A` | `$6a` | `0` | `1` | rotate right through carry |
| `CLC` | `CLC` | `$18` | `0` | `1` | clear carry |
| `SEC` | `SEC` | `$38` | `0` | `1` | set carry |
| `BEQ` | `BEQ label` | `$f0` | `1` | `2` | branch if zero set |
| `BNE` | `BNE label` | `$d0` | `1` | `2` | branch if zero clear |
| `BCC` | `BCC label` | `$90` | `1` | `2` | branch if carry clear |
| `BCS` | `BCS label` | `$b0` | `1` | `2` | branch if carry set |
| `BMI` | `BMI label` | `$30` | `1` | `2` | branch if negative set |
| `BPL` | `BPL label` | `$10` | `1` | `2` | branch if negative clear |
| `JMP` | `JMP $nnnn` | `$4c` | `2` | `3` | unconditional jump |
| `JSR` | `JSR $nnnn` | `$20` | `2` | `3` | jump to subroutine |
| `RTS` | `RTS` | `$60` | `0` | `1` | return from subroutine |
| `PHA` | `PHA` | `$48` | `0` | `1` | push A to stack |
| `PLA` | `PLA` | `$68` | `0` | `1` | pull A from stack |

## Quick Usage Examples

```asm
LDA #$20
STA $d020
```

```asm
CLC
LDA $fb
ADC #$40
STA $fb
```

```asm
LDX #$08
loop:
DEX
BNE loop
```

For the longer per-instruction explanations, examples, and comments, see the previous
project notes history or extend this page as needed.

## Related Pages

- [6502-instructions-extra.md](6502-instructions-extra.md)
- [6502-reference.md](6502-reference.md)
