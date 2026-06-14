# C64 Character Table And Charset Layout

This file explains how the C64 character set is laid out in memory and how a custom character set is usually built or replaced.

It focuses on character **slots** and **glyph memory**, because those are the things that matter most when building or replacing a charset.

Important reminder:

- `PETSCII`, `screen codes`, and `character slots` are related, but not identical
- screen RAM stores screen codes
- the character set provides the 8x8 glyph data for slots `0-255`

## Character Set Format

A normal C64 character set is:

- `256` character slots
- `8` bytes per character
- `2048` bytes total

## Character Cell Size

Each character cell is:

- `8x8` pixels
- `1` bit per pixel

Each character slot uses:

- `8` bytes
- `1` byte per row

## Row Format

Within one glyph:

- byte `0` = top row
- byte `1` = next row
- ...
- byte `7` = bottom row

Within each byte:

- bit `7` = left-most pixel
- bit `0` = right-most pixel

Example row:

```text
10011001
```

means:

- pixel 0 on
- pixel 1 off
- pixel 2 off
- pixel 3 on
- pixel 4 on
- pixel 5 off
- pixel 6 off
- pixel 7 on

## Character Slot Order

Slots are stored sequentially:

- slot `0` occupies bytes `0-7`
- slot `1` occupies bytes `8-15`
- slot `2` occupies bytes `16-23`
- and so on

Memory formula:

- `glyph address = base + (slot * 8)`

If the charset base is `$2000`:

- slot `0` starts at `$2000`
- slot `1` starts at `$2008`
- slot `65` starts at `$2208`

## Alignment And Placement

A character set is normally placed in a contiguous `2 KB` block aligned to a `2 KB` boundary.

Examples of valid bases:

- `$0000`
- `$0800`
- `$1000`
- `$1800`
- `$2000`
- `$2800`
- `$3000`
- `$3800`

In practice, the VIC must also be able to see the charset in the currently selected VIC bank.

## Built-In Character ROM

The built-in character ROM is `4 KB`, which contains two `2 KB` character sets:

- uppercase/graphics set
- lowercase/uppercase set

The visible glyph appearance depends on which built-in set is active.

When people talk about “the C64 character table,” they may mean:

- PETSCII input codes
- screen codes
- character slot numbers
- ROM glyph shapes

This page is mainly about **character slot numbers and glyph memory addresses**.

## Replacing The Character Set

The normal workflow for a custom charset is:

1. copy the built-in character set from ROM into RAM, or start from a blank 2 KB buffer
2. edit the 8 bytes for any slots you want to change
3. point the VIC at the RAM-based charset

Typical reasons to copy ROM first:

- preserve letters and punctuation
- only customize a few symbols
- use the stock set as a starting point

Typical reasons to start blank:

- fully custom art
- game tiles
- page/image-specific character maps

## How The VIC Uses It

The VIC reads character glyphs using:

- the current VIC bank
- the character-memory pointer setup

That means replacing the charset usually involves:

- placing the 2 KB charset in RAM inside the active VIC bank
- adjusting the VIC memory-pointer register so the VIC reads from that base

For related addressing details, see:

- [memory-map.md](memory-map.md)
- [notes/banking.md](notes/banking.md)

## Printable Character Column

The table below uses a practical slot-label approach:

- for the common text range, visible characters are listed directly
- for graphics-heavy ranges, labels like `GFX 64` are used
- reverse-video slots are labeled `REV ...`

These labels are intended to help locate slots, not to claim that every built-in ROM bank shows exactly the same visual glyph in every mode.

## Character Slot Table

| Dec | Hex | Printable / Label | Glyph address |
| --- | --- | --- | --- |
| 0 | `$00` | @ | `base+$0000` |
| 1 | `$01` | A | `base+$0008` |
| 2 | `$02` | B | `base+$0010` |
| 3 | `$03` | C | `base+$0018` |
| 4 | `$04` | D | `base+$0020` |
| 5 | `$05` | E | `base+$0028` |
| 6 | `$06` | F | `base+$0030` |
| 7 | `$07` | G | `base+$0038` |
| 8 | `$08` | H | `base+$0040` |
| 9 | `$09` | I | `base+$0048` |
| 10 | `$0A` | J | `base+$0050` |
| 11 | `$0B` | K | `base+$0058` |
| 12 | `$0C` | L | `base+$0060` |
| 13 | `$0D` | M | `base+$0068` |
| 14 | `$0E` | N | `base+$0070` |
| 15 | `$0F` | O | `base+$0078` |
| 16 | `$10` | P | `base+$0080` |
| 17 | `$11` | Q | `base+$0088` |
| 18 | `$12` | R | `base+$0090` |
| 19 | `$13` | S | `base+$0098` |
| 20 | `$14` | T | `base+$00A0` |
| 21 | `$15` | U | `base+$00A8` |
| 22 | `$16` | V | `base+$00B0` |
| 23 | `$17` | W | `base+$00B8` |
| 24 | `$18` | X | `base+$00C0` |
| 25 | `$19` | Y | `base+$00C8` |
| 26 | `$1A` | Z | `base+$00D0` |
| 27 | `$1B` | [ | `base+$00D8` |
| 28 | `$1C` | GBP | `base+$00E0` |
| 29 | `$1D` | ] | `base+$00E8` |
| 30 | `$1E` | ^ | `base+$00F0` |
| 31 | `$1F` | LEFT | `base+$00F8` |
| 32 | `$20` | SPACE | `base+$0100` |
| 33 | `$21` | ! | `base+$0108` |
| 34 | `$22` | " | `base+$0110` |
| 35 | `$23` | # | `base+$0118` |
| 36 | `$24` | $ | `base+$0120` |
| 37 | `$25` | % | `base+$0128` |
| 38 | `$26` | & | `base+$0130` |
| 39 | `$27` | ' | `base+$0138` |
| 40 | `$28` | ( | `base+$0140` |
| 41 | `$29` | ) | `base+$0148` |
| 42 | `$2A` | * | `base+$0150` |
| 43 | `$2B` | + | `base+$0158` |
| 44 | `$2C` | , | `base+$0160` |
| 45 | `$2D` | - | `base+$0168` |
| 46 | `$2E` | . | `base+$0170` |
| 47 | `$2F` | / | `base+$0178` |
| 48 | `$30` | 0 | `base+$0180` |
| 49 | `$31` | 1 | `base+$0188` |
| 50 | `$32` | 2 | `base+$0190` |
| 51 | `$33` | 3 | `base+$0198` |
| 52 | `$34` | 4 | `base+$01A0` |
| 53 | `$35` | 5 | `base+$01A8` |
| 54 | `$36` | 6 | `base+$01B0` |
| 55 | `$37` | 7 | `base+$01B8` |
| 56 | `$38` | 8 | `base+$01C0` |
| 57 | `$39` | 9 | `base+$01C8` |
| 58 | `$3A` | : | `base+$01D0` |
| 59 | `$3B` | ; | `base+$01D8` |
| 60 | `$3C` | < | `base+$01E0` |
| 61 | `$3D` | = | `base+$01E8` |
| 62 | `$3E` | > | `base+$01F0` |
| 63 | `$3F` | ? | `base+$01F8` |
| 64 | `$40` | GFX 64 | `base+$0200` |
| 65 | `$41` | GFX 65 | `base+$0208` |
| 66 | `$42` | GFX 66 | `base+$0210` |
| 67 | `$43` | GFX 67 | `base+$0218` |
| 68 | `$44` | GFX 68 | `base+$0220` |
| 69 | `$45` | GFX 69 | `base+$0228` |
| 70 | `$46` | GFX 70 | `base+$0230` |
| 71 | `$47` | GFX 71 | `base+$0238` |
| 72 | `$48` | GFX 72 | `base+$0240` |
| 73 | `$49` | GFX 73 | `base+$0248` |
| 74 | `$4A` | GFX 74 | `base+$0250` |
| 75 | `$4B` | GFX 75 | `base+$0258` |
| 76 | `$4C` | GFX 76 | `base+$0260` |
| 77 | `$4D` | GFX 77 | `base+$0268` |
| 78 | `$4E` | GFX 78 | `base+$0270` |
| 79 | `$4F` | GFX 79 | `base+$0278` |
| 80 | `$50` | GFX 80 | `base+$0280` |
| 81 | `$51` | GFX 81 | `base+$0288` |
| 82 | `$52` | GFX 82 | `base+$0290` |
| 83 | `$53` | GFX 83 | `base+$0298` |
| 84 | `$54` | GFX 84 | `base+$02A0` |
| 85 | `$55` | GFX 85 | `base+$02A8` |
| 86 | `$56` | GFX 86 | `base+$02B0` |
| 87 | `$57` | GFX 87 | `base+$02B8` |
| 88 | `$58` | GFX 88 | `base+$02C0` |
| 89 | `$59` | GFX 89 | `base+$02C8` |
| 90 | `$5A` | GFX 90 | `base+$02D0` |
| 91 | `$5B` | GFX 91 | `base+$02D8` |
| 92 | `$5C` | GFX 92 | `base+$02E0` |
| 93 | `$5D` | GFX 93 | `base+$02E8` |
| 94 | `$5E` | GFX 94 | `base+$02F0` |
| 95 | `$5F` | GFX 95 | `base+$02F8` |
| 96 | `$60` | GFX 96 | `base+$0300` |
| 97 | `$61` | GFX 97 | `base+$0308` |
| 98 | `$62` | GFX 98 | `base+$0310` |
| 99 | `$63` | GFX 99 | `base+$0318` |
| 100 | `$64` | GFX 100 | `base+$0320` |
| 101 | `$65` | GFX 101 | `base+$0328` |
| 102 | `$66` | GFX 102 | `base+$0330` |
| 103 | `$67` | GFX 103 | `base+$0338` |
| 104 | `$68` | GFX 104 | `base+$0340` |
| 105 | `$69` | GFX 105 | `base+$0348` |
| 106 | `$6A` | GFX 106 | `base+$0350` |
| 107 | `$6B` | GFX 107 | `base+$0358` |
| 108 | `$6C` | GFX 108 | `base+$0360` |
| 109 | `$6D` | GFX 109 | `base+$0368` |
| 110 | `$6E` | GFX 110 | `base+$0370` |
| 111 | `$6F` | GFX 111 | `base+$0378` |
| 112 | `$70` | GFX 112 | `base+$0380` |
| 113 | `$71` | GFX 113 | `base+$0388` |
| 114 | `$72` | GFX 114 | `base+$0390` |
| 115 | `$73` | GFX 115 | `base+$0398` |
| 116 | `$74` | GFX 116 | `base+$03A0` |
| 117 | `$75` | GFX 117 | `base+$03A8` |
| 118 | `$76` | GFX 118 | `base+$03B0` |
| 119 | `$77` | GFX 119 | `base+$03B8` |
| 120 | `$78` | GFX 120 | `base+$03C0` |
| 121 | `$79` | GFX 121 | `base+$03C8` |
| 122 | `$7A` | GFX 122 | `base+$03D0` |
| 123 | `$7B` | GFX 123 | `base+$03D8` |
| 124 | `$7C` | GFX 124 | `base+$03E0` |
| 125 | `$7D` | GFX 125 | `base+$03E8` |
| 126 | `$7E` | GFX 126 | `base+$03F0` |
| 127 | `$7F` | GFX 127 | `base+$03F8` |
| 128 | `$80` | REV @ | `base+$0400` |
| 129 | `$81` | REV A | `base+$0408` |
| 130 | `$82` | REV B | `base+$0410` |
| 131 | `$83` | REV C | `base+$0418` |
| 132 | `$84` | REV D | `base+$0420` |
| 133 | `$85` | REV E | `base+$0428` |
| 134 | `$86` | REV F | `base+$0430` |
| 135 | `$87` | REV G | `base+$0438` |
| 136 | `$88` | REV H | `base+$0440` |
| 137 | `$89` | REV I | `base+$0448` |
| 138 | `$8A` | REV J | `base+$0450` |
| 139 | `$8B` | REV K | `base+$0458` |
| 140 | `$8C` | REV L | `base+$0460` |
| 141 | `$8D` | REV M | `base+$0468` |
| 142 | `$8E` | REV N | `base+$0470` |
| 143 | `$8F` | REV O | `base+$0478` |
| 144 | `$90` | REV P | `base+$0480` |
| 145 | `$91` | REV Q | `base+$0488` |
| 146 | `$92` | REV R | `base+$0490` |
| 147 | `$93` | REV S | `base+$0498` |
| 148 | `$94` | REV T | `base+$04A0` |
| 149 | `$95` | REV U | `base+$04A8` |
| 150 | `$96` | REV V | `base+$04B0` |
| 151 | `$97` | REV W | `base+$04B8` |
| 152 | `$98` | REV X | `base+$04C0` |
| 153 | `$99` | REV Y | `base+$04C8` |
| 154 | `$9A` | REV Z | `base+$04D0` |
| 155 | `$9B` | REV [ | `base+$04D8` |
| 156 | `$9C` | REV GBP | `base+$04E0` |
| 157 | `$9D` | REV ] | `base+$04E8` |
| 158 | `$9E` | REV ^ | `base+$04F0` |
| 159 | `$9F` | REV LEFT | `base+$04F8` |
| 160 | `$A0` | REV SPACE | `base+$0500` |
| 161 | `$A1` | REV ! | `base+$0508` |
| 162 | `$A2` | REV " | `base+$0510` |
| 163 | `$A3` | REV # | `base+$0518` |
| 164 | `$A4` | REV $ | `base+$0520` |
| 165 | `$A5` | REV % | `base+$0528` |
| 166 | `$A6` | REV & | `base+$0530` |
| 167 | `$A7` | REV ' | `base+$0538` |
| 168 | `$A8` | REV ( | `base+$0540` |
| 169 | `$A9` | REV ) | `base+$0548` |
| 170 | `$AA` | REV * | `base+$0550` |
| 171 | `$AB` | REV + | `base+$0558` |
| 172 | `$AC` | REV , | `base+$0560` |
| 173 | `$AD` | REV - | `base+$0568` |
| 174 | `$AE` | REV . | `base+$0570` |
| 175 | `$AF` | REV / | `base+$0578` |
| 176 | `$B0` | REV 0 | `base+$0580` |
| 177 | `$B1` | REV 1 | `base+$0588` |
| 178 | `$B2` | REV 2 | `base+$0590` |
| 179 | `$B3` | REV 3 | `base+$0598` |
| 180 | `$B4` | REV 4 | `base+$05A0` |
| 181 | `$B5` | REV 5 | `base+$05A8` |
| 182 | `$B6` | REV 6 | `base+$05B0` |
| 183 | `$B7` | REV 7 | `base+$05B8` |
| 184 | `$B8` | REV 8 | `base+$05C0` |
| 185 | `$B9` | REV 9 | `base+$05C8` |
| 186 | `$BA` | REV : | `base+$05D0` |
| 187 | `$BB` | REV ; | `base+$05D8` |
| 188 | `$BC` | REV < | `base+$05E0` |
| 189 | `$BD` | REV = | `base+$05E8` |
| 190 | `$BE` | REV > | `base+$05F0` |
| 191 | `$BF` | REV ? | `base+$05F8` |
| 192 | `$C0` | REV GFX 64 | `base+$0600` |
| 193 | `$C1` | REV GFX 65 | `base+$0608` |
| 194 | `$C2` | REV GFX 66 | `base+$0610` |
| 195 | `$C3` | REV GFX 67 | `base+$0618` |
| 196 | `$C4` | REV GFX 68 | `base+$0620` |
| 197 | `$C5` | REV GFX 69 | `base+$0628` |
| 198 | `$C6` | REV GFX 70 | `base+$0630` |
| 199 | `$C7` | REV GFX 71 | `base+$0638` |
| 200 | `$C8` | REV GFX 72 | `base+$0640` |
| 201 | `$C9` | REV GFX 73 | `base+$0648` |
| 202 | `$CA` | REV GFX 74 | `base+$0650` |
| 203 | `$CB` | REV GFX 75 | `base+$0658` |
| 204 | `$CC` | REV GFX 76 | `base+$0660` |
| 205 | `$CD` | REV GFX 77 | `base+$0668` |
| 206 | `$CE` | REV GFX 78 | `base+$0670` |
| 207 | `$CF` | REV GFX 79 | `base+$0678` |
| 208 | `$D0` | REV GFX 80 | `base+$0680` |
| 209 | `$D1` | REV GFX 81 | `base+$0688` |
| 210 | `$D2` | REV GFX 82 | `base+$0690` |
| 211 | `$D3` | REV GFX 83 | `base+$0698` |
| 212 | `$D4` | REV GFX 84 | `base+$06A0` |
| 213 | `$D5` | REV GFX 85 | `base+$06A8` |
| 214 | `$D6` | REV GFX 86 | `base+$06B0` |
| 215 | `$D7` | REV GFX 87 | `base+$06B8` |
| 216 | `$D8` | REV GFX 88 | `base+$06C0` |
| 217 | `$D9` | REV GFX 89 | `base+$06C8` |
| 218 | `$DA` | REV GFX 90 | `base+$06D0` |
| 219 | `$DB` | REV GFX 91 | `base+$06D8` |
| 220 | `$DC` | REV GFX 92 | `base+$06E0` |
| 221 | `$DD` | REV GFX 93 | `base+$06E8` |
| 222 | `$DE` | REV GFX 94 | `base+$06F0` |
| 223 | `$DF` | REV GFX 95 | `base+$06F8` |
| 224 | `$E0` | REV GFX 96 | `base+$0700` |
| 225 | `$E1` | REV GFX 97 | `base+$0708` |
| 226 | `$E2` | REV GFX 98 | `base+$0710` |
| 227 | `$E3` | REV GFX 99 | `base+$0718` |
| 228 | `$E4` | REV GFX 100 | `base+$0720` |
| 229 | `$E5` | REV GFX 101 | `base+$0728` |
| 230 | `$E6` | REV GFX 102 | `base+$0730` |
| 231 | `$E7` | REV GFX 103 | `base+$0738` |
| 232 | `$E8` | REV GFX 104 | `base+$0740` |
| 233 | `$E9` | REV GFX 105 | `base+$0748` |
| 234 | `$EA` | REV GFX 106 | `base+$0750` |
| 235 | `$EB` | REV GFX 107 | `base+$0758` |
| 236 | `$EC` | REV GFX 108 | `base+$0760` |
| 237 | `$ED` | REV GFX 109 | `base+$0768` |
| 238 | `$EE` | REV GFX 110 | `base+$0770` |
| 239 | `$EF` | REV GFX 111 | `base+$0778` |
| 240 | `$F0` | REV GFX 112 | `base+$0780` |
| 241 | `$F1` | REV GFX 113 | `base+$0788` |
| 242 | `$F2` | REV GFX 114 | `base+$0790` |
| 243 | `$F3` | REV GFX 115 | `base+$0798` |
| 244 | `$F4` | REV GFX 116 | `base+$07A0` |
| 245 | `$F5` | REV GFX 117 | `base+$07A8` |
| 246 | `$F6` | REV GFX 118 | `base+$07B0` |
| 247 | `$F7` | REV GFX 119 | `base+$07B8` |
| 248 | `$F8` | REV GFX 120 | `base+$07C0` |
| 249 | `$F9` | REV GFX 121 | `base+$07C8` |
| 250 | `$FA` | REV GFX 122 | `base+$07D0` |
| 251 | `$FB` | REV GFX 123 | `base+$07D8` |
| 252 | `$FC` | REV GFX 124 | `base+$07E0` |
| 253 | `$FD` | REV GFX 125 | `base+$07E8` |
| 254 | `$FE` | REV GFX 126 | `base+$07F0` |
| 255 | `$FF` | REV GFX 127 | `base+$07F8` |

## Related Docs

- [notes/character-glyphs.md](notes/character-glyphs.md)
- [memory-map.md](memory-map.md)
- [glossary.md](glossary.md)
