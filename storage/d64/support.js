(function () {
  const TPP = window.TPP = window.TPP || {};
  const d64 = TPP.d64 = TPP.d64 || {};
  const DEFAULT_IMAGE_NAME = "disk";
  const REL_MAX_RECORD_LENGTH = 254;
  const REL_DATA_SECTORS_PER_SIDE_SECTOR = 120;
  const REL_MAX_SIDE_SECTORS = 6;

  d64.fileTypes = Object.freeze({
    del: 0x80,
    seq: 0x81,
    prg: 0x82,
    usr: 0x83,
    rel: 0x84,
  });

  d64.trackSectorCount = function (track) {
    if (track >= 1 && track <= 17) return 21;
    if (track >= 18 && track <= 24) return 19;
    if (track >= 25 && track <= 30) return 18;
    if (track >= 31 && track <= 35) return 17;
    return 0;
  };

  d64.trackOffset = function (track, sector) {
    let offset = 0;
    for (let t = 1; t < track; t += 1) {
      offset += 256 * d64.trackSectorCount(t);
    }
    return offset + 256 * sector;
  };

  d64.encodeFileName = function (name, maxLength) {
    const result = new Uint8Array(maxLength || 16).fill(0xa0);
    const value = String(name || "").toUpperCase();
    let index = 0;
    for (let i = 0; i < value.length && index < result.length; i += 1) {
      const ch = value[i];
      const code = value.charCodeAt(i);
      if ((code >= 65 && code <= 90) || (code >= 48 && code <= 57)) {
        result[index++] = code;
      } else if (ch === ".") {
        result[index++] = 0x2e;
      } else if (code === 32) {
        result[index++] = 0xa0;
      } else {
        result[index++] = code;
      }
    }
    return result;
  };

  d64.normalizeFileType = function (type) {
    if (typeof type === "number" && Number.isFinite(type)) {
      return Math.max(0, Math.min(255, Math.round(type)));
    }
    const key = String(type || "").trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(d64.fileTypes, key)) {
      return d64.fileTypes[key];
    }
    return d64.fileTypes.seq;
  };

  d64.normalizeRecordLength = function (length) {
    return Math.max(
      1,
      Math.min(REL_MAX_RECORD_LENGTH, Math.round(Number(length) || 0) || 1),
    );
  };

  d64.isRelativeFileType = function (type) {
    return d64.normalizeFileType(type) === d64.fileTypes.rel;
  };

  d64.prepareFileLayout = function (file) {
    const entry = file || {};
    const type = d64.normalizeFileType(entry.type);
    const bytes = entry.data instanceof Uint8Array
      ? entry.data
      : new Uint8Array(entry.data || []);
    if (type !== d64.fileTypes.rel) {
      const dataSectors = Math.max(1, Math.ceil(bytes.length / 254));
      return {
        type: type,
        bytes: bytes,
        dataSectors: dataSectors,
        sideSectorCount: 0,
        totalSectors: dataSectors,
        recordLength: 0,
        recordCount: 0,
      };
    }
    const recordLength = d64.normalizeRecordLength(entry.recordLength);
    const recordCount = Math.max(1, Math.ceil(bytes.length / recordLength));
    const paddedLength = recordCount * recordLength;
    const paddedBytes = new Uint8Array(paddedLength);
    paddedBytes.set(bytes.subarray(0, Math.min(bytes.length, paddedLength)));
    const dataSectors = Math.max(1, Math.ceil(paddedBytes.length / 254));
    const sideSectorCount = Math.max(
      1,
      Math.ceil(dataSectors / REL_DATA_SECTORS_PER_SIDE_SECTOR),
    );
    if (sideSectorCount > REL_MAX_SIDE_SECTORS) {
      throw new Error(
        "REL file exceeds side-sector capacity: " + String(entry.name || ""),
      );
    }
    return {
      type: type,
      bytes: paddedBytes,
      dataSectors: dataSectors,
      sideSectorCount: sideSectorCount,
      totalSectors: dataSectors + sideSectorCount,
      recordLength: recordLength,
      recordCount: recordCount,
    };
  };

  d64.createBamSector = function (freeMap, diskName) {
    const sector = new Uint8Array(256);
    sector[0] = 18;
    sector[1] = 1;
    sector[2] = 0x41;
    sector[3] = 0x00;
    for (let track = 1; track <= 35; track += 1) {
      const trackOffset = 0x04 + (track - 1) * 4;
      const sectorCount = d64.trackSectorCount(track);
      let freeCount = 0;
      const bitmask = [0, 0, 0];
      for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
        const isFree = Boolean(freeMap[track] && freeMap[track][sectorIndex]);
        if (!isFree) continue;
        freeCount += 1;
        const byteIndex = sectorIndex >> 3;
        const bitIndex = sectorIndex & 7;
        bitmask[byteIndex] |= 1 << bitIndex;
      }
      sector[trackOffset] = freeCount;
      sector[trackOffset + 1] = bitmask[0];
      sector[trackOffset + 2] = bitmask[1];
      sector[trackOffset + 3] = bitmask[2];
    }
    const nameBytes = d64.encodeFileName(diskName || DEFAULT_IMAGE_NAME, 16);
    sector.set(nameBytes, 0x90);
    sector[0xa0] = 0xa0;
    sector[0xa1] = 0xa0;
    sector[0xa2] = 0x54;
    sector[0xa3] = 0x50;
    sector[0xa4] = 0xa0;
    sector[0xa5] = 0x32;
    sector[0xa6] = 0x41;
    sector[0xa7] = 0xa0;
    sector[0xa8] = 0xa0;
    return sector;
  };

  d64.createDirectorySector = function (entries, sectorIndex, totalSectors) {
    const sector = new Uint8Array(256);
    const entriesPerSector = 8;
    for (let entryIndex = 0; entryIndex < entriesPerSector; entryIndex += 1) {
      const entry = entries[sectorIndex * entriesPerSector + entryIndex];
      if (!entry) break;
      sector.set(entry, entryIndex * 32);
    }
    if (sectorIndex < totalSectors - 1) {
      sector[0] = 18;
      sector[1] = sectorIndex + 2;
    } else {
      sector[0] = 0;
      sector[1] = 255;
    }
    return sector;
  };

  d64.createDirectoryEntry = function (
    filename,
    type,
    startTrack,
    startSector,
    sectorCount,
    options,
  ) {
    const config = options || {};
    const entry = new Uint8Array(32).fill(0);
    entry[2] = d64.normalizeFileType(type);
    entry[3] = startTrack;
    entry[4] = startSector;
    entry.set(d64.encodeFileName(filename, 16), 5);
    entry[21] = Math.max(0, Math.min(255, Number(config.sideSectorTrack) || 0));
    entry[22] = Math.max(0, Math.min(255, Number(config.sideSectorSector) || 0));
    entry[23] = Math.max(0, Math.min(255, Number(config.recordLength) || 0));
    entry[28] = sectorCount & 0xff;
    entry[29] = (sectorCount >> 8) & 0xff;
    entry[30] = sectorCount & 0xff;
    entry[31] = (sectorCount >> 8) & 0xff;
    return entry;
  };

  d64.allocateSectors = function (count, allocation) {
    const result = [];
    for (let track = allocation.track; track <= 35 && result.length < count; track += 1) {
      if (track === 18) continue;
      const sectorCount = d64.trackSectorCount(track);
      allocation.map[track] = allocation.map[track] || new Array(sectorCount).fill(true);
      for (
        let sector = allocation.sector;
        sector < sectorCount && result.length < count;
        sector += 1
      ) {
        if (!allocation.map[track][sector]) continue;
        allocation.map[track][sector] = false;
        result.push({ track: track, sector: sector });
      }
      allocation.sector = 0;
    }
    if (result.length) {
      const last = result[result.length - 1];
      allocation.track = last.track;
      allocation.sector = last.sector + 1;
      if (allocation.sector >= d64.trackSectorCount(allocation.track)) {
        allocation.track += 1;
        allocation.sector = 0;
      }
    }
    return result;
  };

  d64.writeFile = function (image, data, allocation) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    const sectors = Math.max(1, Math.ceil(bytes.length / 254));
    const blocks = d64.allocateSectors(sectors, allocation);
    if (blocks.length < sectors) return null;
    for (let i = 0; i < sectors; i += 1) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];
      const offset = d64.trackOffset(block.track, block.sector);
      const sector = image.subarray(offset, offset + 256);
      const sliceStart = i * 254;
      const sliceEnd = sliceStart + 254;
      const chunk = bytes.subarray(sliceStart, sliceEnd);
      sector[0] = nextBlock ? nextBlock.track : 0;
      sector[1] = nextBlock ? nextBlock.sector : Math.max(1, chunk.length + 1);
      sector.set(chunk, 2);
    }
    return {
      startTrack: blocks[0].track,
      startSector: blocks[0].sector,
      sectorCount: sectors,
    };
  };

  d64.createRelativeSideSector = function (
    sideBlocks,
    dataBlocks,
    sideSectorIndex,
    recordLength,
  ) {
    const sector = new Uint8Array(256);
    const nextBlock = sideBlocks[sideSectorIndex + 1];
    const currentDataBlocks = dataBlocks.slice(
      sideSectorIndex * REL_DATA_SECTORS_PER_SIDE_SECTOR,
      (sideSectorIndex + 1) * REL_DATA_SECTORS_PER_SIDE_SECTOR,
    );
    sector[0] = nextBlock ? nextBlock.track : 0;
    sector[1] = nextBlock ? nextBlock.sector : 0;
    sector[2] = sideSectorIndex & 0xff;
    sector[3] = d64.normalizeRecordLength(recordLength);
    for (let index = 0; index < REL_MAX_SIDE_SECTORS; index += 1) {
      const block = sideBlocks[index];
      sector[4 + index * 2] = block ? block.track : 0;
      sector[5 + index * 2] = block ? block.sector : 0;
    }
    currentDataBlocks.forEach(function (block, index) {
      const offset = 16 + index * 2;
      sector[offset] = block.track;
      sector[offset + 1] = block.sector;
    });
    return sector;
  };

  d64.writeRelativeFile = function (image, data, allocation, recordLength) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    const dataSectors = Math.max(1, Math.ceil(bytes.length / 254));
    const sideSectorCount = Math.max(
      1,
      Math.ceil(dataSectors / REL_DATA_SECTORS_PER_SIDE_SECTOR),
    );
    if (sideSectorCount > REL_MAX_SIDE_SECTORS) return null;
    const dataBlocks = d64.allocateSectors(dataSectors, allocation);
    if (dataBlocks.length < dataSectors) return null;
    const sideBlocks = d64.allocateSectors(sideSectorCount, allocation);
    if (sideBlocks.length < sideSectorCount) return null;
    for (let i = 0; i < dataSectors; i += 1) {
      const block = dataBlocks[i];
      const nextBlock = dataBlocks[i + 1];
      const offset = d64.trackOffset(block.track, block.sector);
      const sector = image.subarray(offset, offset + 256);
      const sliceStart = i * 254;
      const sliceEnd = sliceStart + 254;
      const chunk = bytes.subarray(sliceStart, sliceEnd);
      sector[0] = nextBlock ? nextBlock.track : 0;
      sector[1] = nextBlock ? nextBlock.sector : Math.max(1, chunk.length + 1);
      sector.set(chunk, 2);
    }
    sideBlocks.forEach(function (block, index) {
      const offset = d64.trackOffset(block.track, block.sector);
      image.set(
        d64.createRelativeSideSector(sideBlocks, dataBlocks, index, recordLength),
        offset,
      );
    });
    return {
      startTrack: dataBlocks[0].track,
      startSector: dataBlocks[0].sector,
      sectorCount: dataSectors + sideSectorCount,
      sideSectorTrack: sideBlocks[0].track,
      sideSectorSector: sideBlocks[0].sector,
      recordLength: d64.normalizeRecordLength(recordLength),
    };
  };

  d64.usableFileSectorCapacity = function () {
    let total = 0;
    for (let track = 1; track <= 35; track += 1) {
      if (track === 18) continue;
      total += d64.trackSectorCount(track);
    }
    return total;
  };

  d64.estimateImageUsage = function (files) {
    const items = Array.isArray(files) ? files : [];
    const fileSectors = items.map(function (file) {
      return d64.prepareFileLayout(file).totalSectors;
    });
    const totalFileSectors = fileSectors.reduce(function (sum, count) {
      return sum + count;
    }, 0);
    const directorySectors = Math.max(1, Math.ceil(items.length / 8));
    return {
      totalFileSectors: totalFileSectors,
      directorySectors: directorySectors,
      usableFileSectors: d64.usableFileSectorCapacity(),
      fileSectors: fileSectors,
    };
  };

  d64.finalizeImage = function (image, allocation, dirSectors, diskName) {
    const freeMap = {};
    for (let track = 1; track <= 35; track += 1) {
      const sectorCount = d64.trackSectorCount(track);
      freeMap[track] = new Array(sectorCount).fill(true);
    }
    const track18Count = d64.trackSectorCount(18);
    for (let sector = 0; sector < track18Count; sector += 1) {
      freeMap[18][sector] = false;
    }
    for (const allocationTrack in allocation.map) {
      if (!Object.prototype.hasOwnProperty.call(allocation.map, allocationTrack)) continue;
      const trackIndex = Number(allocationTrack);
      freeMap[trackIndex] = allocation.map[trackIndex].slice();
    }
    for (let sector = dirSectors + 1; sector < track18Count; sector += 1) {
      freeMap[18][sector] = true;
    }
    const bamSector = d64.createBamSector(freeMap, diskName);
    image.set(bamSector, d64.trackOffset(18, 0));
    for (let index = 0; index < dirSectors; index += 1) {
      image.set(allocation.directorySectors[index], d64.trackOffset(18, 1 + index));
    }
  };

  d64.buildImage = function (files, options) {
    const estimate = d64.estimateImageUsage(files);
    if (estimate.totalFileSectors > estimate.usableFileSectors) return null;
    const image = new Uint8Array(174848);
    const config = options || {};
    const allocation = {
      track: 1,
      sector: 0,
      map: {},
      directorySectors: [],
    };
    const directoryEntries = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const layout = d64.prepareFileLayout(file);
      const fileRecord =
        layout.type === d64.fileTypes.rel
          ? d64.writeRelativeFile(
              image,
              layout.bytes,
              allocation,
              layout.recordLength,
            )
          : d64.writeFile(image, layout.bytes, allocation);
      if (!fileRecord) return null;
      directoryEntries.push(
        d64.createDirectoryEntry(
          file.name,
          layout.type,
          fileRecord.startTrack,
          fileRecord.startSector,
          fileRecord.sectorCount,
          {
            sideSectorTrack: fileRecord.sideSectorTrack,
            sideSectorSector: fileRecord.sideSectorSector,
            recordLength: fileRecord.recordLength,
          },
        ),
      );
    }
    const entriesPerDirectorySector = 8;
    const dirSectors = Math.max(1, Math.ceil(directoryEntries.length / entriesPerDirectorySector));
    if (dirSectors > d64.trackSectorCount(18) - 1) return null;
    for (let i = 0; i < dirSectors; i += 1) {
      allocation.directorySectors.push(
        d64.createDirectorySector(directoryEntries, i, dirSectors),
      );
    }
    d64.finalizeImage(
      image,
      allocation,
      dirSectors,
      config.diskName || config.name || config.title || DEFAULT_IMAGE_NAME,
    );
    return image;
  };

  d64.fileName = function (options) {
    const config = options || {};
    const rawBaseName =
      config.baseName || config.name || config.diskName || config.title || DEFAULT_IMAGE_NAME;
    const safeBaseName = String(rawBaseName || DEFAULT_IMAGE_NAME)
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || DEFAULT_IMAGE_NAME;
    return safeBaseName.replace(/\.d64$/i, "") + ".d64";
  };

  d64.diskFileName = function (options, diskNumber, totalDisks) {
    const base = d64.fileName(options).replace(/\.d64$/i, "");
    const suffix =
      "-disk" +
      String(diskNumber).padStart(2, "0") +
      "-of-" +
      String(totalDisks).padStart(2, "0") +
      ".d64";
    return base + suffix;
  };
})();
