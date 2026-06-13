; Tiny Pockets Press
; Generated D64 loader/reader mirror
; Reflects the logic emitted by TPP.buildD64AssetLoaderProgramBytes()
; in js/export.js.

        *= $c000

; ---------------------------------------------------------------------------
; Layout and KERNAL constants
; ---------------------------------------------------------------------------

CONFIG_BASE          = $c900

STATUS               = CONFIG_BASE + 0
FILENAME_LENGTH      = CONFIG_BASE + 1
FILENAME             = CONFIG_BASE + 2    ; 32-byte filename buffer
FILE_OPEN            = CONFIG_BASE + 34
PTR_LO               = CONFIG_BASE + 35
PTR_HI               = CONFIG_BASE + 36
LEN_LO               = CONFIG_BASE + 37
LEN_HI               = CONFIG_BASE + 38
BAND_COUNT           = CONFIG_BASE + 39
RESTORE_FB           = CONFIG_BASE + 40
RESTORE_FC           = CONFIG_BASE + 41
SRC_LO               = CONFIG_BASE + 42
SRC_HI               = CONFIG_BASE + 43
DST_LO               = CONFIG_BASE + 44
DST_HI               = CONFIG_BASE + 45
RESTORE_FD           = CONFIG_BASE + 46
RESTORE_FE           = CONFIG_BASE + 47
COVER_RECORD_LO      = CONFIG_BASE + 48
COVER_RECORD_HI      = CONFIG_BASE + 49
PROMPT_RECORD_LO     = CONFIG_BASE + 50
PROMPT_RECORD_HI     = CONFIG_BASE + 51
PROMPT_RECORD_COUNT  = CONFIG_BASE + 52
SKIP_LO              = CONFIG_BASE + 53
SKIP_HI              = CONFIG_BASE + 54
READLEN_LO           = CONFIG_BASE + 55
READLEN_HI           = CONFIG_BASE + 56
INTERACTIVE          = CONFIG_BASE + 57

ZP_PTR1_LO           = $fb
ZP_PTR1_HI           = $fc
ZP_PTR2_LO           = $fd
ZP_PTR2_HI           = $fe

KERNAL_SETLFS        = $ffba
KERNAL_SETNAM        = $ffbd
KERNAL_OPEN          = $ffc0
KERNAL_CLOSE         = $ffc3
KERNAL_CHKIN         = $ffc6
KERNAL_CLRCHN        = $ffcc
KERNAL_CHRIN         = $ffcf
KERNAL_SCNKEY        = $ff9f
KERNAL_GETIN         = $ffe4

STATUS_ST            = $0090
KEYBUF_COUNT         = $00c6
RASTER               = $d012

VIC_BANK_SELECT      = $dd00
VIC_D011             = $d011
VIC_D015             = $d015
VIC_D016             = $d016
VIC_D018             = $d018
VIC_D010             = $d010
VIC_D017             = $d017
VIC_D01B             = $d01b
VIC_D01C             = $d01c
VIC_D01D             = $d01d
VIC_BORDER           = $d020
VIC_BG0              = $d021
SPRITE_COLOR0        = $d027

BITMAP_BASE          = $4000
SCREEN_BASE          = $6000
SPRITE_BASE          = $6400
LOAD_BUFFER          = $7000

BITMAP_D011_VALUE    = $3b
BITMAP_D016_VALUE    = $08
BITMAP_D018_VALUE    = $80
VIC_BANK_VALUE       = $02
DEFAULT_BORDER       = $00
DEFAULT_BG           = $00

PROMPT_FILE_NAME:
        .text "0:64.DAT,S,R"

COVER_FILE_NAME:
        .text "0:512.DAT,S,R"

; ---------------------------------------------------------------------------
; Cover-loader entry
; ---------------------------------------------------------------------------

START:
        lda #$02
        sta STATUS
        lda #$00
        sta FILE_OPEN

        lda ZP_PTR1_LO
        sta RESTORE_FB
        lda ZP_PTR1_HI
        sta RESTORE_FC
        lda ZP_PTR2_LO
        sta RESTORE_FD
        lda ZP_PTR2_HI
        sta RESTORE_FE

        jsr CLEAR_KEYS
        jsr SET_COVER_FILENAME
        jsr OPEN_FILE
        bcc OPEN_OK
        jsr CLEANUP
        rts

OPEN_OK:
        jsr SKIP_COVER_RECORDS
        bcc COVER_SKIP_OK
        jsr CLEANUP
        rts

COVER_SKIP_OK:
        lda #<SCREEN_BASE
        sta PTR_LO
        lda #>SCREEN_BASE
        sta PTR_HI
        lda #$00
        sta LEN_LO
        lda #$04
        sta LEN_HI
        jsr STREAM_SEGMENT
        bcc SCREEN_OK
        jsr CLEANUP
        rts

SCREEN_OK:
        jsr HIDE_SPRITES

        lda #DEFAULT_BORDER
        sta VIC_BORDER
        lda #DEFAULT_BG
        sta VIC_BG0

        lda VIC_BANK_SELECT
        and #$fc
        ora #VIC_BANK_VALUE
        sta VIC_BANK_SELECT

        lda #BITMAP_D018_VALUE
        sta VIC_D018
        lda #BITMAP_D016_VALUE
        sta VIC_D016
        lda VIC_D011
        ora #$20
        sta VIC_D011

        lda #<BITMAP_BASE
        sta PTR_LO
        lda #>BITMAP_BASE
        sta PTR_HI
        lda #$40
        sta LEN_LO
        lda #$1f
        sta LEN_HI
        jsr ZERO_SEGMENT

        lda #<BITMAP_BASE
        sta DST_LO
        lda #>BITMAP_BASE
        sta DST_HI
        lda #25
        sta BAND_COUNT

BAND_LOOP:
        lda #<LOAD_BUFFER
        sta PTR_LO
        lda #>LOAD_BUFFER
        sta PTR_HI
        lda #$40
        sta LEN_LO
        lda #$01
        sta LEN_HI
        jsr STREAM_SEGMENT
        bcc NEXT_BAND
        jsr CLEANUP
        rts

NEXT_BAND:
        lda #<LOAD_BUFFER
        sta SRC_LO
        lda #>LOAD_BUFFER
        sta SRC_HI
        lda #$40
        sta LEN_LO
        lda #$01
        sta LEN_HI
        jsr COPY_SEGMENT
        dec BAND_COUNT
        bne BAND_LOOP

        jsr CLEANUP
        jsr HIDE_SPRITES
        jsr CLEAR_KEYS
        lda INTERACTIVE
        beq IMAGE_READY
        jsr DELAY_PROMPT
        jsr LOAD_FALLBACK_PROMPT
        lda PROMPT_RECORD_COUNT
        beq COVER_READY
        jsr SET_PROMPT_FILENAME
        jsr LOAD_PROMPT_FILE
        bcc PROMPT_OPEN_OK
        jmp COVER_READY

PROMPT_OPEN_OK:
        jsr HIDE_SPRITES

COVER_READY:
        jsr SHOW_PROMPT
        jsr CLEAR_KEYS
        jsr WAIT_FOR_KEY

IMAGE_READY:
        lda #$00
        sta STATUS
        rts

; ---------------------------------------------------------------------------
; Generic record reader entry used by BASIC
; ---------------------------------------------------------------------------

READ_RECORDS_ENTRY:
        lda #$02
        sta STATUS
        lda #$00
        sta FILE_OPEN

        lda ZP_PTR1_LO
        sta RESTORE_FB
        lda ZP_PTR1_HI
        sta RESTORE_FC
        lda ZP_PTR2_LO
        sta RESTORE_FD
        lda ZP_PTR2_HI
        sta RESTORE_FE

        jsr OPEN_FILE
        bcc READER_OPEN_OK
        jsr CLEANUP
        rts

READER_OPEN_OK:
        lda SKIP_LO
        sta LEN_LO
        lda SKIP_HI
        sta LEN_HI
        jsr DISCARD_SEGMENT
        bcc READER_SKIP_OK
        jsr CLEANUP
        rts

READER_SKIP_OK:
        lda DST_LO
        sta PTR_LO
        lda DST_HI
        sta PTR_HI
        lda READLEN_LO
        sta LEN_LO
        lda READLEN_HI
        sta LEN_HI
        jsr STREAM_SEGMENT
        bcc READER_DONE_OK
        jsr CLEANUP
        rts

READER_DONE_OK:
        jsr CLEANUP
        lda #$00
        sta STATUS
        rts

; ---------------------------------------------------------------------------
; File and byte helpers
; ---------------------------------------------------------------------------

OPEN_FILE:
        lda FILENAME_LENGTH
        ldx #<FILENAME
        ldy #>FILENAME
        jsr KERNAL_SETNAM

        lda #$02
        ldx #$08
        ldy #$02
        jsr KERNAL_SETLFS

        jsr KERNAL_OPEN
        bcc OPEN_DONE
        sta STATUS
        sec
        rts

OPEN_DONE:
        lda #$01
        sta FILE_OPEN
        ldx #$02
        jsr KERNAL_CHKIN
        bcc HEADER_DONE
        lda #$03
        sta STATUS
        sec
        rts

HEADER_DONE:
        clc
        rts

READ_BYTE:
        lda #$00
        sta STATUS_ST
        jsr KERNAL_CHRIN
        pha
        lda STATUS_ST
        beq READ_BYTE_OK
        and #$40
        bne READ_BYTE_OK
        lda STATUS_ST
        sta STATUS
        pla
        sec
        rts

READ_BYTE_OK:
        pla
        clc
        rts

STREAM_SEGMENT:
        lda PTR_LO
        sta ZP_PTR1_LO
        lda PTR_HI
        sta ZP_PTR1_HI

STREAM_LOOP:
        lda LEN_LO
        ora #$00
        bne STREAM_BYTE
        lda LEN_HI
        beq STREAM_DONE

STREAM_BYTE:
        jsr READ_BYTE
        bcc HAVE_BYTE
        sec
        rts

HAVE_BYTE:
        ldy #$00
        sta (ZP_PTR1_LO),y
        inc ZP_PTR1_LO
        bne STREAM_PTR_OK
        inc ZP_PTR1_HI

STREAM_PTR_OK:
        sec
        lda LEN_LO
        sbc #$01
        sta LEN_LO
        lda LEN_HI
        sbc #$00
        sta LEN_HI
        jmp STREAM_LOOP

STREAM_DONE:
        lda ZP_PTR1_LO
        sta PTR_LO
        lda ZP_PTR1_HI
        sta PTR_HI
        clc
        rts

COPY_SEGMENT:
        lda SRC_LO
        sta ZP_PTR1_LO
        lda SRC_HI
        sta ZP_PTR1_HI
        lda DST_LO
        sta ZP_PTR2_LO
        lda DST_HI
        sta ZP_PTR2_HI

COPY_LOOP:
        lda LEN_LO
        ora #$00
        bne COPY_BYTE
        lda LEN_HI
        beq COPY_DONE

COPY_BYTE:
        ldy #$00
        lda (ZP_PTR1_LO),y
        sta (ZP_PTR2_LO),y
        inc ZP_PTR1_LO
        bne COPY_SRC_OK
        inc ZP_PTR1_HI

COPY_SRC_OK:
        inc ZP_PTR2_LO
        bne COPY_DST_OK
        inc ZP_PTR2_HI

COPY_DST_OK:
        sec
        lda LEN_LO
        sbc #$01
        sta LEN_LO
        lda LEN_HI
        sbc #$00
        sta LEN_HI
        jmp COPY_LOOP

COPY_DONE:
        lda ZP_PTR2_LO
        sta DST_LO
        lda ZP_PTR2_HI
        sta DST_HI
        rts

ZERO_SEGMENT:
        lda PTR_LO
        sta ZP_PTR1_LO
        lda PTR_HI
        sta ZP_PTR1_HI

ZERO_LOOP:
        lda LEN_LO
        ora #$00
        bne ZERO_BYTE
        lda LEN_HI
        beq ZERO_DONE

ZERO_BYTE:
        lda #$00
        ldy #$00
        sta (ZP_PTR1_LO),y
        inc ZP_PTR1_LO
        bne ZERO_PTR_OK
        inc ZP_PTR1_HI

ZERO_PTR_OK:
        sec
        lda LEN_LO
        sbc #$01
        sta LEN_LO
        lda LEN_HI
        sbc #$00
        sta LEN_HI
        jmp ZERO_LOOP

ZERO_DONE:
        lda ZP_PTR1_LO
        sta PTR_LO
        lda ZP_PTR1_HI
        sta PTR_HI
        rts

; ---------------------------------------------------------------------------
; Keyboard helpers
; ---------------------------------------------------------------------------

SCAN_KEY:
        jsr KERNAL_SCNKEY
        jsr KERNAL_GETIN
        beq NO_KEY
        sec
        rts

NO_KEY:
        clc
        rts

WAIT_FOR_KEY:
WAIT_FOR_KEY_RELEASE:
        jsr SCAN_KEY
        bcs WAIT_FOR_KEY_RELEASE

WAIT_FOR_KEY_LOOP:
        jsr SCAN_KEY
        bcc WAIT_FOR_KEY_LOOP
        jsr CLEAR_KEYS
        rts

CLEAR_KEYS:
        lda #$00
        sta KEYBUF_COUNT

CLEAR_GET_LOOP:
        jsr KERNAL_GETIN
        bne CLEAR_GET_LOOP
        rts

; ---------------------------------------------------------------------------
; Prompt file loader
; ---------------------------------------------------------------------------

LOAD_PROMPT_FILE:
        jsr SET_PROMPT_FILENAME
        jsr OPEN_FILE
        bcc PROMPT_FILE_OPEN_OK
        sec
        rts

PROMPT_FILE_OPEN_OK:
        jsr SKIP_PROMPT_RECORDS
        lda #<SPRITE_BASE
        sta PTR_LO
        lda #>SPRITE_BASE
        sta PTR_HI
        lda #$00
        sta LEN_LO
        lda #$02
        sta LEN_HI
        jsr STREAM_SEGMENT
        bcc PROMPT_READ_OK
        jsr CLEANUP
        sec
        rts

PROMPT_READ_OK:
        jsr CLEANUP
        clc
        rts

LOAD_FALLBACK_PROMPT:
        lda #<PROMPT_FALLBACK_LEN
        sta LEN_LO
        lda #>PROMPT_FALLBACK_LEN
        sta LEN_HI
        lda #<SPRITE_BASE
        sta DST_LO
        lda #>SPRITE_BASE
        sta DST_HI
        lda #<PROMPT_FALLBACK_DATA
        sta SRC_LO
        lda #>PROMPT_FALLBACK_DATA
        sta SRC_HI
        jsr COPY_SEGMENT
        rts

; ---------------------------------------------------------------------------
; Cleanup and filename setup
; ---------------------------------------------------------------------------

CLEANUP:
        jsr KERNAL_CLRCHN
        lda FILE_OPEN
        beq CLEANUP_DONE
        lda #$02
        jsr KERNAL_CLOSE
        lda #$00
        sta FILE_OPEN

CLEANUP_DONE:
        lda RESTORE_FB
        sta ZP_PTR1_LO
        lda RESTORE_FC
        sta ZP_PTR1_HI
        lda RESTORE_FD
        sta ZP_PTR2_LO
        lda RESTORE_FE
        sta ZP_PTR2_HI
        rts

SET_PROMPT_FILENAME:
        lda #12
        sta FILENAME_LENGTH
        lda #'0'      : sta FILENAME+0
        lda #':'      : sta FILENAME+1
        lda #'6'      : sta FILENAME+2
        lda #'4'      : sta FILENAME+3
        lda #'.'      : sta FILENAME+4
        lda #'D'      : sta FILENAME+5
        lda #'A'      : sta FILENAME+6
        lda #'T'      : sta FILENAME+7
        lda #','      : sta FILENAME+8
        lda #'S'      : sta FILENAME+9
        lda #','      : sta FILENAME+10
        lda #'R'      : sta FILENAME+11
        rts

SET_COVER_FILENAME:
        lda #13
        sta FILENAME_LENGTH
        lda #'0'      : sta FILENAME+0
        lda #':'      : sta FILENAME+1
        lda #'5'      : sta FILENAME+2
        lda #'1'      : sta FILENAME+3
        lda #'2'      : sta FILENAME+4
        lda #'.'      : sta FILENAME+5
        lda #'D'      : sta FILENAME+6
        lda #'A'      : sta FILENAME+7
        lda #'T'      : sta FILENAME+8
        lda #','      : sta FILENAME+9
        lda #'S'      : sta FILENAME+10
        lda #','      : sta FILENAME+11
        lda #'R'      : sta FILENAME+12
        rts

; ---------------------------------------------------------------------------
; Record skipping and discard helpers
; ---------------------------------------------------------------------------

SKIP_COVER_RECORDS:
        lda COVER_RECORD_LO
        sta SKIP_LO
        lda COVER_RECORD_HI
        sta SKIP_HI

SKIP_COVER_LOOP:
        lda SKIP_LO
        ora #$00
        bne SKIP_COVER_RECORD
        lda SKIP_HI
        beq SKIP_COVER_DONE

SKIP_COVER_RECORD:
        lda #$00
        sta LEN_LO
        lda #$02
        sta LEN_HI
        jsr DISCARD_SEGMENT
        bcc SKIP_COVER_STEP_OK
        sec
        rts

SKIP_COVER_STEP_OK:
        sec
        lda SKIP_LO
        sbc #$01
        sta SKIP_LO
        lda SKIP_HI
        sbc #$00
        sta SKIP_HI
        jmp SKIP_COVER_LOOP

SKIP_COVER_DONE:
        rts

SKIP_PROMPT_RECORDS:
        lda PROMPT_RECORD_LO
        sta SKIP_LO
        lda PROMPT_RECORD_HI
        sta SKIP_HI

SKIP_PROMPT_LOOP:
        lda SKIP_LO
        ora #$00
        bne SKIP_PROMPT_RECORD
        lda SKIP_HI
        beq SKIP_PROMPT_DONE

SKIP_PROMPT_RECORD:
        lda #$40
        sta LEN_LO
        lda #$00
        sta LEN_HI
        jsr DISCARD_SEGMENT
        bcc SKIP_PROMPT_STEP_OK
        sec
        rts

SKIP_PROMPT_STEP_OK:
        sec
        lda SKIP_LO
        sbc #$01
        sta SKIP_LO
        lda SKIP_HI
        sbc #$00
        sta SKIP_HI
        jmp SKIP_PROMPT_LOOP

SKIP_PROMPT_DONE:
        rts

DISCARD_SEGMENT:
DISCARD_LOOP:
        lda LEN_LO
        ora #$00
        bne DISCARD_BYTE
        lda LEN_HI
        beq DISCARD_DONE

DISCARD_BYTE:
        jsr READ_BYTE
        bcc DISCARD_HAVE_BYTE
        sec
        rts

DISCARD_HAVE_BYTE:
        sec
        lda LEN_LO
        sbc #$01
        sta LEN_LO
        lda LEN_HI
        sbc #$00
        sta LEN_HI
        jmp DISCARD_LOOP

DISCARD_DONE:
        clc
        rts

; ---------------------------------------------------------------------------
; Sprite visibility and prompt display
; ---------------------------------------------------------------------------

HIDE_SPRITES:
        lda #$00
        sta VIC_D015
        sta VIC_D010
        sta VIC_D017
        sta VIC_D01D
        sta VIC_D01B
        sta VIC_D01C
        sta $d000
        sta $d002
        sta $d004
        sta $d006
        sta $d008
        sta $d00a
        sta $d00c
        sta $d00e
        sta $d001
        sta $d003
        sta $d005
        sta $d007
        sta $d009
        sta $d00b
        sta $d00d
        sta $d00f
        rts

DELAY_PROMPT:
        ldy #180

DELAY_FRAME:
        lda #$ff

WAIT_HIGH:
        cmp RASTER
        bne WAIT_HIGH

WAIT_LOW:
        cmp RASTER
        beq WAIT_LOW
        dey
        bne DELAY_FRAME
        rts

SHOW_PROMPT:
        lda #136 : sta $d000
        lda #236 : sta $d001
        lda #160 : sta $d002
        lda #236 : sta $d003
        lda #184 : sta $d004
        lda #236 : sta $d005
        lda #208 : sta $d006
        lda #236 : sta $d007
        lda #136 : sta $d008
        lda #236 : sta $d009
        lda #160 : sta $d00a
        lda #236 : sta $d00b
        lda #184 : sta $d00c
        lda #236 : sta $d00d
        lda #208 : sta $d00e
        lda #236 : sta $d00f

        lda #$00
        sta $d027
        sta $d028
        sta $d029
        sta $d02a
        lda #$01
        sta $d02b
        sta $d02c
        sta $d02d
        sta $d02e

        lda #$ff
        sta VIC_D015
        rts

; ---------------------------------------------------------------------------
; Fallback prompt sprite bytes
; ---------------------------------------------------------------------------

; This blob is generated from JavaScript by buildD64PromptSpriteRecordBytes().
; It is copied to $6400 when an external prompt record is not loaded.
; The exact bytes are currently emitted by JS, not maintained here as source.

PROMPT_FALLBACK_DATA:
        ; generated sprite bytes omitted in this mirror file

PROMPT_FALLBACK_END:
PROMPT_FALLBACK_LEN = PROMPT_FALLBACK_END - PROMPT_FALLBACK_DATA

; ---------------------------------------------------------------------------
; Exported entry points
; ---------------------------------------------------------------------------

; START              = $c000
; READ_RECORDS_ENTRY = generated label used by BASIC through SYS
; CONFIG_BASE        = $c900
