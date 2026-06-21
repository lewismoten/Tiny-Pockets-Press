(function () {
  const TPP = window.TPP = window.TPP || {};

  TPP.d64TrackSectorCount = function (track) {
    if (track >= 1 && track <= 17) return 21;
    if (track >= 18 && track <= 24) return 19;
    if (track >= 25 && track <= 30) return 18;
    if (track >= 31 && track <= 35) return 17;
    return 0;
  };

  TPP.d64TrackOffset = function (track, sector) {
    let offset = 0;
    for (let t = 1; t < track; t += 1) {
      offset += 256 * TPP.d64TrackSectorCount(t);
    }
    return offset + 256 * sector;
  };

  TPP.d64EncodeFileName = function (name, maxLength) {
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

  TPP.d64CreateBamSector = function (freeMap, diskName) {
    const sector = new Uint8Array(256);
    sector[0] = 18;
    sector[1] = 1;
    sector[2] = 0x41;
    sector[3] = 0x00;
    for (let track = 1; track <= 35; track += 1) {
      const trackOffset = 0x04 + (track - 1) * 4;
      const sectorCount = TPP.d64TrackSectorCount(track);
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
    const nameBytes = TPP.d64EncodeFileName(diskName || "TINYBOOK", 16);
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

  TPP.d64CreateDirectorySector = function (entries, sectorIndex, totalSectors) {
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

  TPP.d64CreateDirectoryEntry = function (
    filename,
    type,
    startTrack,
    startSector,
    sectorCount,
  ) {
    const entry = new Uint8Array(32).fill(0);
    entry[2] = type;
    entry[3] = startTrack;
    entry[4] = startSector;
    entry.set(TPP.d64EncodeFileName(filename, 16), 5);
    entry[28] = sectorCount & 0xff;
    entry[29] = (sectorCount >> 8) & 0xff;
    entry[30] = sectorCount & 0xff;
    entry[31] = (sectorCount >> 8) & 0xff;
    return entry;
  };

  TPP.d64AllocateSectors = function (count, allocation) {
    const result = [];
    for (let track = allocation.track; track <= 35 && result.length < count; track += 1) {
      if (track === 18) continue;
      const sectorCount = TPP.d64TrackSectorCount(track);
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
      if (allocation.sector >= TPP.d64TrackSectorCount(allocation.track)) {
        allocation.track += 1;
        allocation.sector = 0;
      }
    }
    return result;
  };

  TPP.d64WriteFile = function (image, data, allocation) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    const sectors = Math.max(1, Math.ceil(bytes.length / 254));
    const blocks = TPP.d64AllocateSectors(sectors, allocation);
    if (blocks.length < sectors) return null;
    for (let i = 0; i < sectors; i += 1) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];
      const offset = TPP.d64TrackOffset(block.track, block.sector);
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

  TPP.d64UsableFileSectorCapacity = function () {
    let total = 0;
    for (let track = 1; track <= 35; track += 1) {
      if (track === 18) continue;
      total += TPP.d64TrackSectorCount(track);
    }
    return total;
  };

  TPP.d64EstimateImageUsage = function (files) {
    const items = Array.isArray(files) ? files : [];
    const fileSectors = items.map(function (file) {
      const size = file && file.data && typeof file.data.length === "number"
        ? file.data.length
        : 0;
      return Math.max(1, Math.ceil(size / 254));
    });
    const totalFileSectors = fileSectors.reduce(function (sum, count) {
      return sum + count;
    }, 0);
    const directorySectors = Math.max(1, Math.ceil(items.length / 8));
    return {
      totalFileSectors: totalFileSectors,
      directorySectors: directorySectors,
      usableFileSectors: TPP.d64UsableFileSectorCapacity(),
      fileSectors: fileSectors,
    };
  };

  TPP.d64FinalizeImage = function (image, allocation, dirSectors, diskName) {
    const freeMap = {};
    for (let track = 1; track <= 35; track += 1) {
      const sectorCount = TPP.d64TrackSectorCount(track);
      freeMap[track] = new Array(sectorCount).fill(true);
    }
    const track18Count = TPP.d64TrackSectorCount(18);
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
    const bamSector = TPP.d64CreateBamSector(freeMap, diskName);
    image.set(bamSector, TPP.d64TrackOffset(18, 0));
    for (let index = 0; index < dirSectors; index += 1) {
      image.set(allocation.directorySectors[index], TPP.d64TrackOffset(18, 1 + index));
    }
  };

  TPP.buildD64Image = function (files, book) {
    const estimate = TPP.d64EstimateImageUsage(files);
    if (estimate.totalFileSectors > estimate.usableFileSectors) return null;
    const image = new Uint8Array(174848);
    const allocation = {
      track: 1,
      sector: 0,
      map: {},
      directorySectors: [],
    };
    const directoryEntries = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const fileRecord = TPP.d64WriteFile(image, file.data, allocation);
      if (!fileRecord) return null;
      directoryEntries.push(
        TPP.d64CreateDirectoryEntry(
          file.name,
          file.type,
          fileRecord.startTrack,
          fileRecord.startSector,
          fileRecord.sectorCount,
        ),
      );
    }
    const entriesPerDirectorySector = 8;
    const dirSectors = Math.max(1, Math.ceil(directoryEntries.length / entriesPerDirectorySector));
    if (dirSectors > TPP.d64TrackSectorCount(18) - 1) return null;
    for (let i = 0; i < dirSectors; i += 1) {
      allocation.directorySectors.push(
        TPP.d64CreateDirectorySector(directoryEntries, i, dirSectors),
      );
    }
    TPP.d64FinalizeImage(image, allocation, dirSectors, book && book.title);
    return image;
  };

  TPP.exportD64FileName = function (book) {
    return TPP.exportFileName(book, { extension: "d64", kind: "c64" });
  };

  TPP.exportD64DiskFileName = function (book, diskNumber, totalDisks) {
    const base = TPP.exportFileName(book, {
      extension: "d64",
      kind: "c64-disk" + String(diskNumber),
    });
    const suffix =
      "-disk" +
      String(diskNumber).padStart(2, "0") +
      "-of-" +
      String(totalDisks).padStart(2, "0") +
      ".d64";
    return base.replace(/\.d64$/i, suffix);
  };
})();
