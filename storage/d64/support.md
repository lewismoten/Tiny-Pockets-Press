# D64 Support API

This document describes the low-level support API exposed by [support.js](./support.js).

When loaded, the file creates:

```js
window.TPP.d64
```

The goal of this API is to make the disk-image building primitives reusable outside of Tiny Pockets Press. A different host can use these methods directly to estimate capacity, allocate sectors, build directory entries, and assemble `.d64` images.

This is not a full implementation of every D64 variant. It intentionally targets the common emulator-friendly format: standard 35-track images without appended error information.

## Namespace

The public namespace is:

```js
window.TPP.d64
```

All support methods described below live under that object.

## Header And Disk Inspection

The support layer can also read the standard D64 BAM/header sector and directory layout.

This is useful for:

- inspecting generated images
- reading disk names, ids, and DOS markers
- reading the BAM and free-space map
- listing files and decoding file metadata
- reading file payloads directly from the image
- reading `REL` side sectors and decoded records
- rebuilding images after editing files or disk metadata
- comparing two images to notice a disk swap

The support layer exposes header-related enums:

```js
window.TPP.d64.diskFormats
window.TPP.d64.dosVersions
window.TPP.d64.dosTypes
window.TPP.d64.headerOffsets
```

These currently target the common 35-track no-error-info D64 layout.

## Data Shape

The higher-level `buildImage(files, options)` helper expects file records like this:

```ts
type D64File = {
  name: string;
  type: number | keyof typeof window.TPP.d64.fileTypes;
  closed?: boolean;
  locked?: boolean;
  recordLength?: number;
  data: Uint8Array | ArrayBuffer | number[];
};
```

Common Commodore file types include:

- `0x80`: DEL
- `0x81`: SEQ
- `0x82`: PRG
- `0x83`: USR
- `0x84`: REL

For readability, you can also use the built-in enum values:

```js
window.TPP.d64.fileTypes.del
window.TPP.d64.fileTypes.seq
window.TPP.d64.fileTypes.prg
window.TPP.d64.fileTypes.usr
window.TPP.d64.fileTypes.rel
```

String keys are also accepted by helpers that normalize file types:

```js
"del"
"seq"
"prg"
"usr"
"rel"
```

The optional `options` argument is only used for generic disk naming. A minimal shape is:

```ts
type D64ImageOptions = {
  diskName?: string;
  title?: string;
  name?: string;
  baseName?: string;
};
```

Supported disk-info fields used when building or rebuilding images:

```ts
type D64DiskInfo = {
  diskName?: string;
  diskId?: string;
  dosType?: string;
  dosVersion?: number | keyof typeof window.TPP.d64.dosVersions;
  title?: string;
  name?: string;
  baseName?: string;
};
```

## File Names

Directory filenames are stored separately from file type metadata.

- Filenames can be up to `16` bytes in the directory entry.
- The file type is not part of the filename field.
- A DOS-style `8.3` naming convention is optional, but can be useful for clarity.
- This implementation uppercases names before encoding them.

For example, these are both reasonable:

```text
README
SPRITES.BIN
```

## Relative Files

The support layer can now build true `REL` files when a file record uses:

```js
type: "rel"
```

or:

```js
type: window.TPP.d64.fileTypes.rel
```

For `REL` files:

- `recordLength` should be provided.
- `recordLength` is normalized into the range `1-254`.
- data is padded to a whole number of records.
- the support layer allocates side sectors and writes relative-file metadata into the directory entry.

Example:

```js
{
  name: "BOOK.IDX",
  type: "rel",
  recordLength: 9,
  data: indexBytes,
}
```

Tiny Pockets Press itself still exports its book-reader files as `SEQ` today because the current BASIC and machine-language readers still assume sequential access. The low-level D64 support API can generate `REL` files now, but the higher-level TPP reader path has not been switched over yet.

Before that conversion happens, this repo now includes a local validator:

```bash
npm run check:d64-rel
```

That validation currently checks:

- a generated `REL` file writes a `REL` directory entry
- the directory entry stores side-sector track/sector and record length
- side-sector pointers match the actual data-sector chain
- a known test case includes at least one record that crosses a sector boundary
- normal `SEQ` files still behave as expected
- standard header parsing and disk-signature change detection behave as expected

## File Type Enum

The support layer exposes a readable enum:

```js
window.TPP.d64.fileTypes
```

Shape:

```ts
type D64FileTypes = {
  del: number;
  seq: number;
  prg: number;
  usr: number;
  rel: number;
};
```

The support layer also exposes readable header enums:

```ts
type D64DiskFormats = {
  d64_35_track: string;
};

type D64DosVersions = {
  dos2_6: number;
};

type D64DosTypes = {
  dos2a: string;
};

type D64DirectoryEntryFlags = {
  closed: number;
  locked: number;
};
```

## Public Methods

### `trackSectorCount(track)`

Returns the number of sectors for a 1541 disk track.

Parameters:

- `track: number`

Returns:

- `number`

Notes:

- Valid track range is `1` through `35`.
- Returns `0` for out-of-range tracks.

### `trackOffset(track, sector)`

Returns the byte offset into a standard 174,848-byte D64 image for a given track and sector.

Parameters:

- `track: number`
- `sector: number`

Returns:

- `number`

### `readSector(image, track, sector)`

Reads one 256-byte sector from a D64 image.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `track: number`
- `sector: number`

Returns:

- `Uint8Array`

### `encodeFileName(name, maxLength)`

Encodes a filename into the padded PETSCII-like directory format used by this implementation.

Parameters:

- `name: string`
- `maxLength?: number`

Returns:

- `Uint8Array`

Notes:

- Output defaults to `16` bytes.
- Names are uppercased.
- Letters `A-Z`, digits `0-9`, spaces, and `.` are handled intentionally.
- Spaces become `0xA0`.
- Other characters are passed through as byte values from the JavaScript string.

### `decodeName(bytes)`

Decodes a padded filename or header field into a trimmed string.

Parameters:

- `bytes: Uint8Array | ArrayBuffer | number[]`

Returns:

- `string`

### `normalizeDiskId(diskId)`

Normalizes a 2-character disk id field.

Parameters:

- `diskId: string`

Returns:

- `string`

### `normalizeDosType(dosType)`

Normalizes a DOS type marker such as `2A`.

Parameters:

- `dosType: string`

Returns:

- `string`

### `normalizeDosVersion(dosVersion)`

Normalizes a DOS version byte.

Parameters:

- `dosVersion: number | string`

Returns:

- `number`

### `normalizeDiskInfo(options)`

Normalizes disk-level metadata used by image builders and mutation helpers.

Parameters:

- `options: D64DiskInfo`

Returns:

- `{ diskName, diskId, dosType, dosVersion }`

### `normalizeFileType(type)`

Normalizes a file type from either a numeric value or a readable enum key.

Parameters:

- `type: number | "del" | "seq" | "prg" | "usr" | "rel"`

Returns:

- `number`

Notes:

- Unknown values currently fall back to `SEQ`.

### `encodeDirectoryEntryType(type, options)`

Encodes a directory-entry type byte from a file type plus status flags.

Parameters:

- `type: number | "del" | "seq" | "prg" | "usr" | "rel"`
- `options?: { closed?: boolean, locked?: boolean }`

Returns:

- `number`

### `normalizeRecordLength(length)`

Normalizes a relative-file record length into the supported range.

Parameters:

- `length: number`

Returns:

- `number`

Notes:

- Range is `1-254`.

### `isRelativeFileType(type)`

Checks whether a normalized file type is `REL`.

Parameters:

- `type: number | "del" | "seq" | "prg" | "usr" | "rel"`

Returns:

- `boolean`

### `prepareFileLayout(file)`

Normalizes file metadata before image writing.

Parameters:

- `file: D64File`

Returns:

- `{ type, bytes, dataSectors, sideSectorCount, totalSectors, recordLength, recordCount }`

Notes:

- `REL` files are padded to full records before sector allocation.
- Non-`REL` files keep `recordLength` and `recordCount` at `0`.

### `readHeader(image)`

Reads the BAM/header sector at track `18`, sector `0`.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`

Returns:

- `{ format, imageSize, track, sector, nextDirectoryTrack, nextDirectorySector, dosVersionByte, dosVersionName, diskName, diskId, dosType }`

Notes:

- `dosVersionName` is resolved from `dosVersions` when recognized.
- This helper is intended for the standard 35-track D64 layout.

### `decodeDirectoryEntryType(typeByte)`

Decodes a raw directory entry type byte into a friendlier structure.

Parameters:

- `typeByte: number`

Returns:

- `{ raw, code, fileType, closed, locked }`

### `readBam(image)`

Reads the BAM information from the standard header sector.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`

Returns:

- `{ track, sector, tracks }`

Notes:

- `tracks` is an array of per-track free-space data.
- Each item includes `track`, `freeCount`, and `sectorFree`.

### `readFreeMap(image)`

Builds a simpler per-track free-space map from the BAM.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`

Returns:

- `Record<number, boolean[]>`

### `readDirectoryEntry(image, entryIndex)`

Reads one parsed directory entry by flat entry index.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryIndex: number`

Returns:

- `{ index, sector, slot, typeByte, fileType, startTrack, startSector, name, sideSectorTrack, sideSectorSector, recordLength, blockCount, raw }`

Notes:

- Includes `closed` and `locked` flags decoded from the type byte.

### `readDirectoryEntries(image, options)`

Reads parsed directory entries until the first empty directory slot or the configured maximum.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `options?: { maxEntries?: number }`

Returns:

- `Array<object>`

### `findDirectoryEntryByName(image, name, options)`

Finds the first directory entry whose decoded name matches the provided name case-insensitively.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `name: string`
- `options?: { maxEntries?: number }`

Returns:

- `object | null`

### `readFileChain(image, startTrack, startSector)`

Reads a normal Commodore file chain starting from the given track and sector.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `startTrack: number`
- `startSector: number`

Returns:

- `{ blocks, payload }`

### `readRelativeSideSectors(image, sideSectorTrack, sideSectorSector)`

Reads a `REL` side-sector chain.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `sideSectorTrack: number`
- `sideSectorSector: number`

Returns:

- `Array<{ track, sector, nextTrack, nextSector, sideSectorIndex, recordLength, allSideSectors, dataSectors, raw }>`

### `readFile(image, entryOrName, options)`

Reads a file from the image either by parsed directory entry or by filename.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `null | { entry, fileType, payload, blocks, sideSectors? }`

### `readFiles(image, options)`

Reads all directory-listed files into a rebuild-friendly structure.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `options?: { maxEntries?: number }`

Returns:

- `Array<{ name, type, closed, locked, recordLength?, data, entry }>`

### `readRelativeRecords(image, entryOrName, options)`

Reads and slices a `REL` file into fixed-length records.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `null | { entry, recordLength, recordCount, records, sideSectors, payload, blocks }`

### `inspectImage(image, options)`

Builds a higher-level inspection object for a whole image.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `options?: { maxEntries?: number }`

Returns:

- `{ header, bam, entries }`

### `rebuildImage(image, files, options)`

Rebuilds a standard D64 image from an existing image plus a replacement file list.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `files: D64File[]`
- `options?: D64DiskInfo`

Returns:

- `Uint8Array | null`

Notes:

- Existing disk metadata is preserved by default unless overridden.

### `setDiskInfo(image, updates, options)`

Rebuilds an image with updated disk-level metadata.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `updates: D64DiskInfo`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `setDiskName(image, diskName, options)`

Convenience helper for renaming the disk.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `diskName: string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `updateFile(image, entryOrName, updates, options)`

Rebuilds an image with one file updated.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `updates: Partial<D64File>`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

Notes:

- Can be used to change `locked` and `closed` as well as name, type, record length, and data.

### `renameFile(image, entryOrName, newName, options)`

Rebuilds an image with one file renamed.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `newName: string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `lockFile(image, entryOrName, options)`

Rebuilds an image with one file marked locked.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `unlockFile(image, entryOrName, options)`

Rebuilds an image with one file marked unlocked.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `closeFile(image, entryOrName, options)`

Rebuilds an image with one file marked closed.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `openFile(image, entryOrName, options)`

Rebuilds an image with one file marked open.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `deleteFile(image, entryOrName, options)`

Rebuilds an image with one file removed.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`
- `entryOrName: object | string`
- `options?: { maxEntries?: number }`

Returns:

- `Uint8Array | null`

### `diskSignature(image)`

Builds a compact metadata signature for disk-change detection.

Parameters:

- `image: Uint8Array | ArrayBuffer | number[]`

Returns:

- `string`

### `hasDiskChanged(leftImage, rightImage)`

Compares two images using `diskSignature(image)`.

Parameters:

- `leftImage: Uint8Array | ArrayBuffer | number[]`
- `rightImage: Uint8Array | ArrayBuffer | number[]`

Returns:

- `boolean`

### `createBamSector(freeMap, diskName)`

Builds the BAM sector for track `18`, sector `0`.

Parameters:

- `freeMap: Record<number, boolean[]>`
- `diskName?: string`

Returns:

- `Uint8Array`

### `createDirectorySector(entries, sectorIndex, totalSectors)`

Builds one 256-byte directory sector from an array of 32-byte directory entries.

Parameters:

- `entries: Uint8Array[]`
- `sectorIndex: number`
- `totalSectors: number`

Returns:

- `Uint8Array`

### `createDirectoryEntry(filename, type, startTrack, startSector, sectorCount)`

Builds a single 32-byte directory entry.

Parameters:

- `filename: string`
- `type: number | "del" | "seq" | "prg" | "usr" | "rel"`
- `startTrack: number`
- `startSector: number`
- `sectorCount: number`

Returns:

- `Uint8Array`

Notes:

- The block count is written into both common legacy positions used by some viewers and emulators.
- The `type` is normalized through `normalizeFileType(type)`.

### `allocateSectors(count, allocation)`

Allocates file sectors across the disk, skipping track `18`.

Parameters:

- `count: number`
- `allocation: { track: number, sector: number, map: Record<number, boolean[]> }`

Returns:

- `Array<{ track: number, sector: number }>`

Notes:

- The `allocation` object is mutated.
- Allocation proceeds forward from the current `track` and `sector`.

### `writeFile(image, data, allocation)`

Writes one file into a D64 image using Commodore sector chaining.

Parameters:

- `image: Uint8Array`
- `data: Uint8Array | ArrayBuffer | number[]`
- `allocation: { track: number, sector: number, map: Record<number, boolean[]> }`

Returns:

- `null | { startTrack: number, startSector: number, sectorCount: number }`

Notes:

- File payload bytes are stored in 254-byte chunks because the first two bytes of each sector are used for the next-track/next-sector link.

### `createRelativeSideSector(sideBlocks, dataBlocks, sideSectorIndex, recordLength)`

Builds one side sector for a relative file.

Parameters:

- `sideBlocks: Array<{ track: number, sector: number }>`
- `dataBlocks: Array<{ track: number, sector: number }>`
- `sideSectorIndex: number`
- `recordLength: number`

Returns:

- `Uint8Array`

### `writeRelativeFile(image, data, allocation, recordLength)`

Writes one `REL` file into a D64 image, including side sectors.

Parameters:

- `image: Uint8Array`
- `data: Uint8Array | ArrayBuffer | number[]`
- `allocation: { track: number, sector: number, map: Record<number, boolean[]> }`
- `recordLength: number`

Returns:

- `null | { startTrack, startSector, sectorCount, sideSectorTrack, sideSectorSector, recordLength }`

### `usableFileSectorCapacity()`

Returns the number of data sectors available for files on a standard 35-track image, excluding track `18`.

Parameters:

- none

Returns:

- `number`

### `estimateImageUsage(files)`

Estimates how many sectors a file set will consume.

Parameters:

- `files: D64File[]`

Returns:

- `{ totalFileSectors, directorySectors, usableFileSectors, fileSectors }`

### `finalizeImage(image, allocation, dirSectors, diskName)`

Writes the BAM and directory sectors into an image after data sectors have already been written.

Parameters:

- `image: Uint8Array`
- `allocation: { map: Record<number, boolean[]>, directorySectors: Uint8Array[] }`
- `dirSectors: number`
- `diskName?: string`

Returns:

- `void`

### `buildImage(files, options)`

Builds a complete standard D64 image from a set of file records.

Parameters:

- `files: D64File[]`
- `options?: D64ImageOptions`

Returns:

- `Uint8Array | null`

Notes:

- Returns `null` if the image cannot fit the requested content.
- Uses `diskName`, `name`, `title`, or `baseName` as the disk name when available.
- `REL` files are written with side sectors when `type` resolves to `rel`.

### `fileName(options)`

Builds a generic single-disk filename without relying on any host-specific naming helper.

Parameters:

- `options?: D64ImageOptions`

Returns:

- `string`

### `diskFileName(options, diskNumber, totalDisks)`

Builds a generic multi-disk filename without relying on any host-specific naming helper.

Parameters:

- `options?: D64ImageOptions`
- `diskNumber: number`
- `totalDisks: number`

Returns:

- `string`

Notes:

- Output uses the pattern `name-diskNN-of-NN.d64`.

## Limitations

Current limitations of this support layer:

- It is not a full implementation of every D64 variant.
- It targets standard 35-track D64 images only.
- Output image size is fixed at `174848` bytes, which matches the common no-error-info 35-track format.
- It does not write appended per-sector error information.
- It does not support 40-track or 42-track extended D64 variants.
- Track `18` is reserved for the BAM and directory.
- Directory capacity is limited by the available sectors on track `18`.
- Each directory sector holds `8` directory entries.
- Filenames are stored in a `16`-byte field.
- Filename normalization is intentionally simple and not a full PETSCII conversion layer.
- File type support is simplified to a normalized directory type byte.
- `REL` support is limited to fixed-length records with record lengths up to `254` bytes.
- `REL` support currently assumes up to `6` side sectors per file.
- File-type state bits such as custom locked/open combinations are not modeled separately from the normalized type byte.
- Disk header customization is minimal and not exposed as a richer API for disk ID or DOS type variations.
- This layer does not validate Commodore semantics beyond the structural image layout.
- There is no visual disk-map API yet.
- There is no sector fragmentation strategy beyond forward allocation.

## Practical Limits

Important practical constraints:

- Maximum tracks: `35`
- Standard image size: `174848` bytes
- Error-info bytes appended: `0`
- Maximum sectors per file payload sector: `254` bytes of data
- Directory sectors available on track `18`: `18`
- Approximate maximum directory entries: `18 * 8 = 144`
- Maximum `REL` record length: `254` bytes
- Maximum supported side sectors per `REL` file: `6`

In practice, the file-count limit is often lower because data sectors usually run out before directory entries do.

## Example

```js
const files = [
  {
    name: "HELLO",
    type: 0x82,
    data: new Uint8Array([0x01, 0x08, 0x0b, 0x08]),
  },
  {
    name: "BOOK.IDX",
    type: "rel",
    recordLength: 9,
    data: new Uint8Array([0x44, 0x53, 0x4b, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]),
  },
];

const usage = window.TPP.d64.estimateImageUsage(files);
const imageBytes = window.TPP.d64.buildImage(files, { title: "MY DISK" });
```

## Future Direction

This namespace is intended to support future tooling such as:

- visual disk-layout inspection
- directory viewers
- per-sector occupancy maps
- custom packing strategies
- alternate repo consumers that want to generate D64 images without Tiny Pockets Press
