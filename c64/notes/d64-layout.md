# D64 And Data Packing Notes

## 1541 Capacity Reminder

A standard `.d64` image has limited usable space. Not all sectors are available for file payload because some are consumed by:

- BAM
- directory
- track/sector chaining overhead

Large bitmap books will exceed a single disk quickly.

## Current Strategy

The exporter now supports multiple disk images and duplicates important shared data across disks:

- home metadata
- TOC
- cover
- prompt assets needed for the early experience

Graphic pages are then distributed across disks according to remaining capacity.

## Why Fixed-Size DAT Files

Using grouped record-size files such as `16.DAT`, `256.DAT`, and `1024.DAT` keeps the index compact:

- record start is counted in records, not raw byte positions
- the data file name already implies record size
- BASIC and ML can compute byte ranges with simpler math

## Record Math

To read a payload:

1. locate the index record
2. decode disk number and class from `diskClass`
3. map class to `n.DAT`
4. byte offset = `startRecord * recordSize`
5. byte length = `recordCount * recordSize`

The ML reader currently behaves like a sequential reader that discards bytes until the desired offset, then streams the requested range into RAM.

## Future Direction

If performance becomes a bigger problem, possible next steps are:

- a true fast loader
- larger grouped asset files with smarter block maps
- custom sector tables rather than KERNAL byte-by-byte streaming
- more aggressive duplication or compression tradeoff analysis
