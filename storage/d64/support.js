(function () {
  const TPP = window.TPP = window.TPP || {};
  const d64 = TPP.d64 = TPP.d64 || {};
  const DEFAULT_IMAGE_NAME = "disk";
  const STANDARD_IMAGE_SIZE = 174848;
  const REL_MAX_RECORD_LENGTH = 254;
  const REL_DATA_SECTORS_PER_SIDE_SECTOR = 120;
  const REL_MAX_SIDE_SECTORS = 6;
  const DIRECTORY_TRACK = 18;
  const BAM_SECTOR = 0;
  const DIRECTORY_START_SECTOR = 1;

  d64.fileTypes = Object.freeze({
    del: 0x80,
    seq: 0x81,
    prg: 0x82,
    usr: 0x83,
    rel: 0x84,
  });

  d64.diskFormats = Object.freeze({
    d64_35_track: "d64_35_track",
  });

  d64.dosVersions = Object.freeze({
    dos2_6: 0x41,
  });

  d64.dosTypes = Object.freeze({
    dos2a: "2A",
  });

  d64.directoryEntryFlags = Object.freeze({
    closed: 0x80,
    locked: 0x40,
  });

  d64.headerOffsets = Object.freeze({
    nextDirectoryTrack: 0x00,
    nextDirectorySector: 0x01,
    dosVersion: 0x02,
    bamStart: 0x04,
    diskNameStart: 0x90,
    diskNameLength: 0x10,
    diskIdStart: 0xa2,
    diskIdLength: 0x02,
    dosTypeStart: 0xa5,
    dosTypeLength: 0x02,
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

  d64.readSector = function (image, track, sector) {
    const bytes = image instanceof Uint8Array ? image : new Uint8Array(image || []);
    const offset = d64.trackOffset(track, sector);
    return bytes.subarray(offset, offset + 256);
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

  d64.decodeName = function (bytes) {
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    const chars = [];
    for (let index = 0; index < data.length; index += 1) {
      const value = data[index];
      if (value === 0x00) break;
      if (value === 0xa0) {
        chars.push(" ");
        continue;
      }
      chars.push(String.fromCharCode(value & 0xff));
    }
    return chars.join("").trimEnd();
  };

  d64.normalizeDiskId = function (diskId) {
    return d64.decodeName(d64.encodeFileName(String(diskId || "TP"), 2)) || "TP";
  };

  d64.normalizeDosType = function (dosType) {
    const value = String(dosType || d64.dosTypes.dos2a).trim().toUpperCase();
    return value || d64.dosTypes.dos2a;
  };

  d64.normalizeDosVersion = function (dosVersion) {
    if (typeof dosVersion === "number" && Number.isFinite(dosVersion)) {
      return Math.max(0, Math.min(255, Math.round(dosVersion)));
    }
    const key = String(dosVersion || "").trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(d64.dosVersions, key)) {
      return d64.dosVersions[key];
    }
    return d64.dosVersions.dos2_6;
  };

  d64.normalizeDiskInfo = function (options) {
    const config = options || {};
    return {
      diskName:
        String(
          config.diskName || config.name || config.title || config.baseName || DEFAULT_IMAGE_NAME,
        ).trim() || DEFAULT_IMAGE_NAME,
      diskId: d64.normalizeDiskId(config.diskId),
      dosType: d64.normalizeDosType(config.dosType),
      dosVersion: d64.normalizeDosVersion(config.dosVersion),
    };
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

  d64.readHeader = function (image) {
    const sector = d64.readSector(image, DIRECTORY_TRACK, BAM_SECTOR);
    const offsets = d64.headerOffsets;
    return {
      format: d64.diskFormats.d64_35_track,
      imageSize: image && typeof image.length === "number" ? image.length : STANDARD_IMAGE_SIZE,
      track: DIRECTORY_TRACK,
      sector: BAM_SECTOR,
      nextDirectoryTrack: sector[offsets.nextDirectoryTrack],
      nextDirectorySector: sector[offsets.nextDirectorySector],
      dosVersionByte: sector[offsets.dosVersion],
      dosVersionName:
        sector[offsets.dosVersion] === d64.dosVersions.dos2_6 ? "dos2_6" : "unknown",
      diskName: d64.decodeName(
        sector.subarray(offsets.diskNameStart, offsets.diskNameStart + offsets.diskNameLength),
      ),
      diskId: d64.decodeName(
        sector.subarray(offsets.diskIdStart, offsets.diskIdStart + offsets.diskIdLength),
      ),
      dosType: d64.decodeName(
        sector.subarray(offsets.dosTypeStart, offsets.dosTypeStart + offsets.dosTypeLength),
      ),
    };
  };

  d64.decodeDirectoryEntryType = function (typeByte) {
    const value = Math.max(0, Math.min(255, Number(typeByte) || 0));
    const code = value & 0x07;
    const typeName =
      {
        0: "del",
        1: "seq",
        2: "prg",
        3: "usr",
        4: "rel",
      }[code] || "unknown";
    return {
      raw: value,
      code: code,
      fileType: typeName,
      closed: Boolean(value & d64.directoryEntryFlags.closed),
      locked: Boolean(value & d64.directoryEntryFlags.locked),
    };
  };

  d64.readBam = function (image) {
    const sector = d64.readSector(image, DIRECTORY_TRACK, BAM_SECTOR);
    const tracks = [];
    for (let track = 1; track <= 35; track += 1) {
      const offset = d64.headerOffsets.bamStart + (track - 1) * 4;
      const sectorCount = d64.trackSectorCount(track);
      const freeCount = sector[offset];
      const sectorFree = [];
      for (let sectorIndex = 0; sectorIndex < sectorCount; sectorIndex += 1) {
        const byteIndex = 1 + (sectorIndex >> 3);
        const bitIndex = sectorIndex & 7;
        sectorFree.push(Boolean(sector[offset + byteIndex] & (1 << bitIndex)));
      }
      tracks.push({
        track: track,
        freeCount: freeCount,
        sectorFree: sectorFree,
      });
    }
    return {
      track: DIRECTORY_TRACK,
      sector: BAM_SECTOR,
      tracks: tracks,
    };
  };

  d64.readFreeMap = function (image) {
    const bam = d64.readBam(image);
    const map = {};
    bam.tracks.forEach(function (trackInfo) {
      map[trackInfo.track] = trackInfo.sectorFree.slice();
    });
    return map;
  };

  d64.readDirectoryEntry = function (image, entryIndex) {
    const index = Math.max(0, Math.floor(Number(entryIndex) || 0));
    const sectorIndex = Math.floor(index / 8);
    const slotIndex = index % 8;
    const sector = d64.readSector(image, DIRECTORY_TRACK, DIRECTORY_START_SECTOR + sectorIndex);
    const offset = slotIndex * 32;
    const entry = sector.subarray(offset, offset + 32);
    const typeByte = entry[2];
    const typeInfo = d64.decodeDirectoryEntryType(typeByte);
    return {
      index: index,
      sector: DIRECTORY_START_SECTOR + sectorIndex,
      slot: slotIndex,
      typeByte: typeByte,
      fileType: typeInfo.fileType,
      typeCode: typeInfo.code,
      closed: typeInfo.closed,
      locked: typeInfo.locked,
      startTrack: entry[3],
      startSector: entry[4],
      name: d64.decodeName(entry.subarray(5, 21)),
      sideSectorTrack: entry[21],
      sideSectorSector: entry[22],
      recordLength: entry[23],
      blockCount: entry[28] | (entry[29] << 8),
      raw: new Uint8Array(entry),
    };
  };

  d64.readDirectoryEntries = function (image, options) {
    const config = options || {};
    const maxEntries = Math.max(1, Math.floor(Number(config.maxEntries) || 144));
    const entries = [];
    for (let index = 0; index < maxEntries; index += 1) {
      const entry = d64.readDirectoryEntry(image, index);
      if (!entry.typeByte) break;
      entries.push(entry);
    }
    return entries;
  };

  d64.findDirectoryEntryByName = function (image, name, options) {
    const target = String(name || "").trim().toUpperCase();
    if (!target) return null;
    const entries = d64.readDirectoryEntries(image, options);
    for (let index = 0; index < entries.length; index += 1) {
      if (String(entries[index].name || "").trim().toUpperCase() === target) {
        return entries[index];
      }
    }
    return null;
  };

  d64.readFileChain = function (image, startTrack, startSector) {
    const blocks = [];
    const payload = [];
    const visited = {};
    let track = Math.max(0, Math.floor(Number(startTrack) || 0));
    let sector = Math.max(0, Math.floor(Number(startSector) || 0));
    while (track) {
      const key = String(track) + ":" + String(sector);
      if (visited[key]) {
        throw new Error("File chain loops at " + key);
      }
      visited[key] = true;
      const block = d64.readSector(image, track, sector);
      const nextTrack = block[0];
      const nextSector = block[1];
      const usedBytes = nextTrack === 0
        ? Math.max(0, Math.min(254, nextSector - 1))
        : 254;
      for (let index = 0; index < usedBytes; index += 1) {
        payload.push(block[2 + index]);
      }
      blocks.push({
        track: track,
        sector: sector,
        nextTrack: nextTrack,
        nextSector: nextSector,
        usedBytes: usedBytes,
      });
      if (!nextTrack) break;
      track = nextTrack;
      sector = nextSector;
    }
    return {
      blocks: blocks,
      payload: new Uint8Array(payload),
    };
  };

  d64.readRelativeSideSectors = function (image, sideSectorTrack, sideSectorSector) {
    const sectors = [];
    const visited = {};
    let track = Math.max(0, Math.floor(Number(sideSectorTrack) || 0));
    let sector = Math.max(0, Math.floor(Number(sideSectorSector) || 0));
    while (track) {
      const key = String(track) + ":" + String(sector);
      if (visited[key]) {
        throw new Error("Side-sector chain loops at " + key);
      }
      visited[key] = true;
      const block = d64.readSector(image, track, sector);
      const allSideSectors = [];
      const dataSectors = [];
      for (let index = 0; index < REL_MAX_SIDE_SECTORS; index += 1) {
        const pointerTrack = block[4 + index * 2];
        const pointerSector = block[5 + index * 2];
        if (!pointerTrack) break;
        allSideSectors.push({
          track: pointerTrack,
          sector: pointerSector,
        });
      }
      for (let offset = 16; offset < 256; offset += 2) {
        const pointerTrack = block[offset];
        const pointerSector = block[offset + 1];
        if (!pointerTrack) break;
        dataSectors.push({
          track: pointerTrack,
          sector: pointerSector,
        });
      }
      sectors.push({
        track: track,
        sector: sector,
        nextTrack: block[0],
        nextSector: block[1],
        sideSectorIndex: block[2],
        recordLength: block[3],
        allSideSectors: allSideSectors,
        dataSectors: dataSectors,
        raw: new Uint8Array(block),
      });
      if (!block[0]) break;
      track = block[0];
      sector = block[1];
    }
    return sectors;
  };

  d64.readFile = function (image, entryOrName, options) {
    const config = options || {};
    const entry =
      typeof entryOrName === "string"
        ? d64.findDirectoryEntryByName(image, entryOrName, config)
        : entryOrName || null;
    if (!entry) return null;
    const chain = d64.readFileChain(image, entry.startTrack, entry.startSector);
    const result = {
      entry: entry,
      fileType: entry.fileType,
      payload: chain.payload,
      blocks: chain.blocks,
    };
    if (entry.fileType === "rel" && entry.sideSectorTrack) {
      result.sideSectors = d64.readRelativeSideSectors(
        image,
        entry.sideSectorTrack,
        entry.sideSectorSector,
      );
    }
    return result;
  };

  d64.readRelativeRecords = function (image, entryOrName, options) {
    const file = d64.readFile(image, entryOrName, options);
    if (!file || file.fileType !== "rel") return null;
    const recordLength = Math.max(1, Number(file.entry.recordLength) || 1);
    const records = [];
    for (let offset = 0; offset < file.payload.length; offset += recordLength) {
      records.push(file.payload.slice(offset, offset + recordLength));
    }
    return {
      entry: file.entry,
      recordLength: recordLength,
      recordCount: records.length,
      records: records,
      sideSectors: file.sideSectors || [],
      payload: file.payload,
      blocks: file.blocks,
    };
  };

  d64.readFiles = function (image, options) {
    return d64.readDirectoryEntries(image, options).map(function (entry) {
      const file = d64.readFile(image, entry, options);
      return {
        name: entry.name,
        type: entry.fileType,
        recordLength: entry.recordLength || undefined,
        data: file ? file.payload.slice() : new Uint8Array(0),
        entry: entry,
      };
    });
  };

  d64.inspectImage = function (image, options) {
    return {
      header: d64.readHeader(image),
      bam: d64.readBam(image),
      entries: d64.readDirectoryEntries(image, options),
      files: d64.readFiles(image, options),
    };
  };

  d64.diskSignature = function (image) {
    const header = d64.readHeader(image);
    return JSON.stringify({
      format: header.format,
      imageSize: header.imageSize,
      nextDirectoryTrack: header.nextDirectoryTrack,
      nextDirectorySector: header.nextDirectorySector,
      dosVersionByte: header.dosVersionByte,
      diskName: header.diskName,
      diskId: header.diskId,
      dosType: header.dosType,
    });
  };

  d64.hasDiskChanged = function (leftImage, rightImage) {
    return d64.diskSignature(leftImage) !== d64.diskSignature(rightImage);
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

  d64.createBamSector = function (freeMap, options) {
    const diskInfo = d64.normalizeDiskInfo(
      typeof options === "string" ? { diskName: options } : options,
    );
    const sector = new Uint8Array(256);
    sector[0] = DIRECTORY_TRACK;
    sector[1] = DIRECTORY_START_SECTOR;
    sector[2] = diskInfo.dosVersion;
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
    const nameBytes = d64.encodeFileName(diskInfo.diskName, 16);
    sector.set(nameBytes, 0x90);
    sector[0xa0] = 0xa0;
    sector[0xa1] = 0xa0;
    sector.set(d64.encodeFileName(diskInfo.diskId, 2), 0xa2);
    sector[0xa4] = 0xa0;
    sector.set(d64.encodeFileName(diskInfo.dosType, 2), 0xa5);
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
    const image = new Uint8Array(STANDARD_IMAGE_SIZE);
    const config = options || {};
    const diskInfo = d64.normalizeDiskInfo(config);
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
      diskInfo,
    );
    return image;
  };

  d64.rebuildImage = function (image, files, options) {
    const header = d64.readHeader(image);
    const config = Object.assign(
      {
        diskName: header.diskName || DEFAULT_IMAGE_NAME,
        diskId: header.diskId || "TP",
        dosType: header.dosType || d64.dosTypes.dos2a,
        dosVersion: header.dosVersionByte || d64.dosVersions.dos2_6,
      },
      options || {},
    );
    return d64.buildImage(files, config);
  };

  d64.setDiskInfo = function (image, updates, options) {
    return d64.rebuildImage(image, d64.readFiles(image, options), updates);
  };

  d64.setDiskName = function (image, diskName, options) {
    return d64.setDiskInfo(
      image,
      Object.assign({}, options || {}, { diskName: diskName }),
      options,
    );
  };

  d64.updateFile = function (image, entryOrName, updates, options) {
    const files = d64.readFiles(image, options);
    const targetName =
      typeof entryOrName === "string"
        ? String(entryOrName).trim().toUpperCase()
        : String((entryOrName && entryOrName.name) || "").trim().toUpperCase();
    const index = files.findIndex(function (file) {
      return String(file.name || "").trim().toUpperCase() === targetName;
    });
    if (index < 0) {
      throw new Error("File not found: " + String(entryOrName || ""));
    }
    const patch = updates || {};
    files[index] = {
      name: Object.prototype.hasOwnProperty.call(patch, "name")
        ? String(patch.name || "").trim()
        : files[index].name,
      type: Object.prototype.hasOwnProperty.call(patch, "type")
        ? patch.type
        : files[index].type,
      recordLength: Object.prototype.hasOwnProperty.call(patch, "recordLength")
        ? patch.recordLength
        : files[index].recordLength,
      data: Object.prototype.hasOwnProperty.call(patch, "data")
        ? (patch.data instanceof Uint8Array ? patch.data : new Uint8Array(patch.data || []))
        : files[index].data,
    };
    return d64.rebuildImage(image, files, options);
  };

  d64.renameFile = function (image, entryOrName, newName, options) {
    return d64.updateFile(
      image,
      entryOrName,
      {
        name: newName,
      },
      options,
    );
  };

  d64.deleteFile = function (image, entryOrName, options) {
    const files = d64.readFiles(image, options);
    const targetName =
      typeof entryOrName === "string"
        ? String(entryOrName).trim().toUpperCase()
        : String((entryOrName && entryOrName.name) || "").trim().toUpperCase();
    const filtered = files.filter(function (file) {
      return String(file.name || "").trim().toUpperCase() !== targetName;
    });
    if (filtered.length === files.length) {
      throw new Error("File not found: " + String(entryOrName || ""));
    }
    return d64.rebuildImage(image, filtered, options);
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
