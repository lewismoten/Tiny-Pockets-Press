# 6502 Reference

Parent pages: [Notes Index](README.md), [6502.md](6502.md), [C64 README](../README.md)

## Registers

- `A`: accumulator
- `X`: index register X
- `Y`: index register Y
- `PC`: program counter
- `SP`: stack pointer
- `P`: processor status

## Important Status Flags

| Flag | Meaning |
| --- | --- |
| `N` | negative |
| `V` | overflow |
| `B` | break |
| `D` | decimal |
| `I` | interrupt disable |
| `Z` | zero |
| `C` | carry |

## Addressing Modes Seen Often

| Mode | Example | Notes |
| --- | --- | --- |
| immediate | `LDA #$20` | operand is the literal byte |
| absolute | `STA $d020` | full 16-bit address |
| absolute,X | `LDA $4000,X` | base plus X |
| absolute,Y | `LDA $4000,Y` | base plus Y |
| zero page | `LDA $fb` | faster 8-bit address |
| zero page,X | `LDA $fb,X` | zero-page indexed |
| indirect indexed | `LDA ($fb),Y` | pointer in zero page plus Y |
| relative | `BNE loop` | signed branch offset |
| accumulator | `ASL A` | operate directly on A |
| implied | `CLC` | no explicit operand |

## Loader Coding Patterns

### Pointer Walks

```asm
LDY #$00
LDA ($fb),Y
INY
```

### Carry-Safe 16-Bit Addition

```asm
CLC
LDA $fb
ADC #$40
STA $fb
LDA $fc
ADC #$00
STA $fc
```

### Tight Counted Loops

```asm
LDX #$08
loop:
DEX
BNE loop
```

### Register Save / Restore

```asm
PHA
; work
PLA
```
