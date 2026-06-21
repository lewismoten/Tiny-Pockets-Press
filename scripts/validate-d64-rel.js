const fs = require("fs");
const path = require("path");
const vm = require("vm");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadD64Support() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "storage", "d64", "support.js"),
    "utf8",
  );
  const sandbox = {
    Uint8Array,
    ArrayBuffer,
    console,
    window: {
      TPP: {},
    },
  };
  sandbox.window.TPP.exportFileName = function (_book, options) {
    const extension = String((options && options.extension) || "bin");
    return "test." + extension;
  };
  sandbox.TPP = sandbox.window.TPP;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: "storage/d64/support.js",
  });
  return sandbox.window.TPP.d64;
}

function trackOffset(d64, track, sector) {
  return d64.trackOffset(track, sector);
}

function readSector(image, d64, track, sector) {
  const offset = trackOffset(d64, track, sector);
  return image.subarray(offset, offset + 256);
}

function readDirectoryEntry(image, d64, entryIndex) {
  const sectorIndex = Math.floor(entryIndex / 8);
  const slotIndex = entryIndex % 8;
  const sector = readSector(image, d64, 18, 1 + sectorIndex);
  const offset = slotIndex * 32;
  return sector.subarray(offset, offset + 32);
}

function decodeFileChain(image, d64, startTrack, startSector) {
  const visited = new Set();
  const blocks = [];
  const payload = [];
  let track = startTrack;
  let sector = startSector;
  while (track !== 0) {
    const key = String(track) + ":" + String(sector);
    assert(!visited.has(key), "File chain loops at " + key);
    visited.add(key);
    const block = readSector(image, d64, track, sector);
    const nextTrack = block[0];
    const nextSector = block[1];
    blocks.push({ track, sector });
    if (nextTrack === 0) {
      const usedLength = Math.max(0, nextSector - 1);
      for (let i = 0; i < usedLength; i += 1) {
        payload.push(block[2 + i]);
      }
      break;
    }
    for (let i = 2; i < 256; i += 1) {
      payload.push(block[i]);
    }
    track = nextTrack;
    sector = nextSector;
  }
  return {
    blocks,
    payload: new Uint8Array(payload),
  };
}

function decodeSideSectorChain(image, d64, startTrack, startSector) {
  const visited = new Set();
  const sectors = [];
  let track = startTrack;
  let sector = startSector;
  while (track !== 0) {
    const key = String(track) + ":" + String(sector);
    assert(!visited.has(key), "Side-sector chain loops at " + key);
    visited.add(key);
    const block = readSector(image, d64, track, sector);
    sectors.push({
      track,
      sector,
      nextTrack: block[0],
      nextSector: block[1],
      index: block[2],
      recordLength: block[3],
      block: block,
    });
    if (block[0] === 0) break;
    track = block[0];
    sector = block[1];
  }
  return sectors;
}

function collectSideSectorDataPointers(sideSectors) {
  const pointers = [];
  sideSectors.forEach(function (sideSector) {
    for (let offset = 16; offset < 256; offset += 2) {
      const track = sideSector.block[offset];
      const sector = sideSector.block[offset + 1];
      if (!track) break;
      pointers.push({ track, sector });
    }
  });
  return pointers;
}

function sameBlock(left, right) {
  return left && right && left.track === right.track && left.sector === right.sector;
}

function validateRelativeFileCrossesSectorBoundary() {
  const d64 = loadD64Support();
  const relRecordLength = 9;
  const relRecordCount = 40;
  const relBytes = new Uint8Array(relRecordLength * relRecordCount);
  for (let index = 0; index < relBytes.length; index += 1) {
    relBytes[index] = index & 0xff;
  }
  const image = d64.buildImage(
    [
      {
        name: "BOOK.IDX",
        type: "rel",
        recordLength: relRecordLength,
        data: relBytes,
      },
    ],
    {
      diskName: "RELTEST",
    },
  );
  assert(image instanceof Uint8Array, "REL image did not build");

  const header = d64.readHeader(image);
  assert(header.track === 18, "Header track mismatch");
  assert(header.sector === 0, "Header sector mismatch");
  assert(header.nextDirectoryTrack === 18, "Header next directory track mismatch");
  assert(header.nextDirectorySector === 1, "Header next directory sector mismatch");
  assert(header.dosVersionByte === d64.dosVersions.dos2_6, "Header DOS version mismatch");
  assert(header.dosType === d64.dosTypes.dos2a, "Header DOS type mismatch");
  assert(header.diskName === "RELTEST", "Header disk name mismatch");
  const bam = d64.readBam(image);
  assert(Array.isArray(bam.tracks) && bam.tracks.length === 35, "BAM track count mismatch");
  const freeMap = d64.readFreeMap(image);
  assert(Array.isArray(freeMap[1]), "Free map missing track 1");

  const entry = readDirectoryEntry(image, d64, 0);
  assert(entry[2] === d64.fileTypes.rel, "Directory type is not REL");
  assert(entry[23] === relRecordLength, "Directory record length mismatch");
  assert(entry[21] !== 0, "Side-sector track missing");
  assert(entry[22] >= 0, "Side-sector sector missing");
  assert(entry[3] !== 0, "Data start track missing");
  assert(entry[4] >= 0, "Data start sector missing");

  const fileChain = decodeFileChain(image, d64, entry[3], entry[4]);
  assert(
    fileChain.payload.length === relBytes.length,
    "REL payload length mismatch",
  );
  assert(
    Buffer.from(fileChain.payload).equals(Buffer.from(relBytes)),
    "REL payload bytes mismatch",
  );
  assert(fileChain.blocks.length >= 2, "REL test did not span multiple data sectors");

  const sideSectors = decodeSideSectorChain(image, d64, entry[21], entry[22]);
  assert(sideSectors.length >= 1, "REL side-sector chain missing");
  sideSectors.forEach(function (sideSector, index) {
    assert(
      sideSector.index === index,
      "Unexpected side-sector index at position " + String(index),
    );
    assert(
      sideSector.recordLength === relRecordLength,
      "Unexpected side-sector record length",
    );
  });

  const dataPointers = collectSideSectorDataPointers(sideSectors);
  assert(
    dataPointers.length === fileChain.blocks.length,
    "Side-sector data pointer count mismatch",
  );
  dataPointers.forEach(function (pointer, index) {
    assert(
      sameBlock(pointer, fileChain.blocks[index]),
      "Side-sector data pointer mismatch at block " + String(index),
    );
  });

  const crossingRecordIndex = Math.floor(254 / relRecordLength);
  const crossingRecordStart = crossingRecordIndex * relRecordLength;
  assert(
    crossingRecordStart < 254 && crossingRecordStart + relRecordLength > 254,
    "Expected a record boundary to cross a sector",
  );

  const entries = d64.readDirectoryEntries(image);
  assert(entries.length === 1, "Expected one directory entry");
  assert(entries[0].name === "BOOK.IDX", "Directory entry name mismatch");
  assert(entries[0].fileType === "rel", "Parsed file type mismatch");
  assert(entries[0].closed === true, "Expected REL directory entry to be closed");

  const foundEntry = d64.findDirectoryEntryByName(image, "book.idx");
  assert(foundEntry && foundEntry.name === "BOOK.IDX", "Directory lookup failed");

  const relFile = d64.readFile(image, "BOOK.IDX");
  assert(relFile && relFile.fileType === "rel", "REL file read failed");
  assert(
    Buffer.from(relFile.payload).equals(Buffer.from(relBytes)),
    "REL file payload via readFile mismatch",
  );

  const relRecords = d64.readRelativeRecords(image, "BOOK.IDX");
  assert(relRecords, "REL record read failed");
  assert(relRecords.recordLength === relRecordLength, "REL record length read mismatch");
  assert(relRecords.recordCount === relRecordCount, "REL record count mismatch");
  assert(relRecords.records.length === relRecordCount, "REL records array mismatch");
  assert(relRecords.sideSectors.length === sideSectors.length, "REL side-sector read mismatch");

  const inspect = d64.inspectImage(image);
  assert(inspect.header.diskName === "RELTEST", "Inspect header mismatch");
  assert(inspect.entries.length === 1, "Inspect entries mismatch");

  assert(d64.hasDiskChanged(image, image) === false, "Disk should not differ from itself");
}

function validateNonRelativeFileStillWorks() {
  const d64 = loadD64Support();
  const image = d64.buildImage([
    {
      name: "HELLO",
      type: "seq",
      data: new Uint8Array([1, 2, 3, 4, 5]),
    },
    {
      name: "README",
      type: "seq",
      data: new Uint8Array([9, 8, 7]),
    },
  ], {
    diskName: "ORIGINAL",
    diskId: "ID",
  });
  assert(image instanceof Uint8Array, "SEQ image did not build");
  const entry = readDirectoryEntry(image, d64, 0);
  assert(entry[2] === d64.fileTypes.seq, "Directory type is not SEQ");
  assert(entry[21] === 0, "SEQ side-sector track should be zero");
  assert(entry[22] === 0, "SEQ side-sector sector should be zero");
  assert(entry[23] === 0, "SEQ record length should be zero");

  const seqFile = d64.readFile(image, "HELLO");
  assert(seqFile && seqFile.fileType === "seq", "SEQ file read failed");
  assert(seqFile.blocks.length === 1, "Expected one SEQ data block");
  assert(
    Buffer.from(seqFile.payload).equals(Buffer.from(new Uint8Array([1, 2, 3, 4, 5]))),
    "SEQ payload mismatch",
  );

  const renamedImage = d64.renameFile(image, "HELLO", "WELCOME");
  const renamedEntry = d64.findDirectoryEntryByName(renamedImage, "WELCOME");
  assert(renamedEntry && renamedEntry.name === "WELCOME", "Rename failed");
  assert(!d64.findDirectoryEntryByName(renamedImage, "HELLO"), "Old file name still present");

  const updatedImage = d64.updateFile(
    renamedImage,
    "WELCOME",
    {
      data: new Uint8Array([6, 5, 4, 3]),
    },
  );
  const updatedFile = d64.readFile(updatedImage, "WELCOME");
  assert(updatedFile, "Updated file missing");
  assert(
    Buffer.from(updatedFile.payload).equals(Buffer.from(new Uint8Array([6, 5, 4, 3]))),
    "Updated payload mismatch",
  );

  const diskRenamedImage = d64.setDiskName(updatedImage, "UPDATED");
  const updatedHeader = d64.readHeader(diskRenamedImage);
  assert(updatedHeader.diskName === "UPDATED", "Disk rename failed");
  assert(updatedHeader.diskId === "ID", "Disk id should be preserved");

  const diskInfoImage = d64.setDiskInfo(diskRenamedImage, {
    diskId: "XY",
    dosType: "2A",
    dosVersion: d64.dosVersions.dos2_6,
  });
  const diskInfoHeader = d64.readHeader(diskInfoImage);
  assert(diskInfoHeader.diskId === "XY", "Disk id update failed");

  const deletedImage = d64.deleteFile(diskInfoImage, "README");
  assert(!d64.findDirectoryEntryByName(deletedImage, "README"), "Delete failed");
  assert(d64.findDirectoryEntryByName(deletedImage, "WELCOME"), "Remaining file missing after delete");

  const secondImage = d64.buildImage([
    {
      name: "WORLD",
      type: "seq",
      data: new Uint8Array([1, 2, 3]),
    },
  ], {
    diskName: "OTHER",
  });
  assert(d64.hasDiskChanged(image, secondImage), "Different disks should have different signatures");
}

validateRelativeFileCrossesSectorBoundary();
validateNonRelativeFileStillWorks();
console.log("D64 REL validation passed.");
