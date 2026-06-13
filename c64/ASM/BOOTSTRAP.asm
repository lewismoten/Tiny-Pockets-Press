; Tiny Pockets Press
; Generated D64 bootstrap mirror
; Reflects TPP.buildD64LoaderBootstrapBytes() in js/export.js.

        *= $c800

KERNAL_SETNAM        = $ffbd
KERNAL_SETLFS        = $ffba
KERNAL_LOAD          = $ffd5

FILENAME_ADDRESS     = $c829
STATUS_ADDRESS       = $c834

START:
        lda #10               ; length of "LOADER.PRG"
        ldx #<FILENAME
        ldy #>FILENAME
        jsr KERNAL_SETNAM

        lda #$01              ; logical file 1
        ldx #$08              ; disk device 8
        ldy #$01              ; secondary address 1
        jsr KERNAL_SETLFS

        lda #$00              ; load address comes from file header
        ldx #$00
        ldy #$00
        jsr KERNAL_LOAD
        bcc LOAD_OK

        lda #$01
        sta STATUS
        rts

LOAD_OK:
        lda #$00
        sta STATUS
        rts

FILENAME:
        .text "LOADER.PRG"
        .byte 0

STATUS:
        ; in the JS-generated binary this byte sits immediately after the string
