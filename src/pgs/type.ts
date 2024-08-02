import { AsyncByteStream, ByteStream } from "../util/bytestream";
import concat from "../util/concat";
import EOFError from "../util/eof";
import ycbcr from "../util/ycbcr";
import ValidationError from "./error";

export const SegmentType = {
  PDS: 0x14,
  ODS: 0x15,
  PCS: 0x16,
  WDS: 0x17,
  END: 0x80,
} as const;

type CompositionObjectWithCropped = {
  objectId: number;
  windowId: number;
  objectCroppedFlag: true;
  objectHorizontalPosition: number;
  objectVerticalPosition: number;
  objectCroppingHorizontalPosition: number
  objectCroppingVerticalPosition: number
  objectCroppingWidth: number
  objectCroppingHeight: number
}
type CompositionObjectWithoutCropped = {
  objectId: number;
  windowId: number;
  objectCroppedFlag: false;
  objectHorizontalPosition: number;
  objectVerticalPosition: number;
}
export type CompositionObject = CompositionObjectWithCropped | CompositionObjectWithoutCropped;
export const CompositionObject = {
  from(stream: ByteStream): CompositionObject {
    const objectId = stream.readU16();
    const windowId = stream.readU8();
    const objectCroppedFlag = stream.readU8() !== 0x00;
    const objectHorizontalPosition = stream.readU16();
    const objectVerticalPosition = stream.readU16();
    if (!objectCroppedFlag) {
      return {
        objectId,
        windowId,
        objectCroppedFlag,
        objectHorizontalPosition,
        objectVerticalPosition,
      };
    }

    const objectCroppingHorizontalPosition = stream.readU16();
    const objectCroppingVerticalPosition = stream.readU16();
    const objectCroppingWidth = stream.readU16();
    const objectCroppingHeight = stream.readU16();
    return {
      objectId,
      windowId,
      objectCroppedFlag,
      objectHorizontalPosition,
      objectVerticalPosition,
      objectCroppingHorizontalPosition,
      objectCroppingVerticalPosition,
      objectCroppingWidth,
      objectCroppingHeight,
    };
  }
}

export const CompositionState = {
  Normal: 0x00,
  AcquisitionPoint: 0x40,
  EpochStart: 0x80,
} as const;

export type PresentationCompositionSegment = {
  width: number;
  height: number;
  frameRate: number;
  compositionNumber: number;
  compositionState: (typeof CompositionState)[keyof typeof CompositionState];
  paletteUpdateFlag: boolean;
  paletteId: number;
  numberOfCompositionObject: number;
  compositionObjects: CompositionObject[];
}
export const PresentationCompositionSegment = {
  from(stream: ByteStream): PresentationCompositionSegment {
    const width = stream.readU16();
    const height = stream.readU16();
    const frameRate = stream.readU8();
    const compositionNumber = stream.readU16();
    const compositionState = stream.readU8();
    if (compositionState !== CompositionState.Normal && compositionState !== CompositionState.AcquisitionPoint && compositionState !== CompositionState.EpochStart) {
      throw new ValidationError('Invalid compositionState');
    }
    const paletteUpdateFlag = stream.readU8() === 0x80;
    const paletteId = stream.readU8();
    const numberOfCompositionObject = stream.readU8();
    const compositionObjects: CompositionObject[] = [];
    for (let i = 0; i < numberOfCompositionObject; i++) {
      compositionObjects.push(CompositionObject.from(stream));
    }

    return {
      width,
      height,
      frameRate,
      compositionNumber,
      compositionState,
      paletteUpdateFlag,
      paletteId,
      numberOfCompositionObject,
      compositionObjects,
    };
  }
}

export type WindowDefinition = {
  windowId: number;
  windowHorizontalPosition: number;
  windowVerticalPosition: number;
  windowWidth: number;
  windowHeight: number;
};
export const WindowDefinition = {
  from(stream: ByteStream): WindowDefinition {
    const windowId = stream.readU8();
    const windowHorizontalPosition = stream.readU16();
    const windowVerticalPosition = stream.readU16();
    const windowWidth = stream.readU16();
    const windowHeight = stream.readU16();

    return {
      windowId,
      windowHorizontalPosition,
      windowVerticalPosition,
      windowWidth,
      windowHeight,
    };
  }
}

export type WindowDefinitionSegment = {
  numberOfWindow: number;
  windows: WindowDefinition[];
}
export const WindowDefinitionSegment = {
  from(stream: ByteStream): WindowDefinitionSegment {
    const numberOfWindow = stream.readU8();
    const windows: WindowDefinition[] = [];
    for (let i = 0; i < numberOfWindow; i++) {
      windows.push(WindowDefinition.from(stream));
    }

    return {
      numberOfWindow,
      windows,
    };
  },
  valueOf(definision?: WindowDefinitionSegment[]): Map<number, WindowDefinition> {
    const widnows = new Map<number, WindowDefinition>();
    for (const window of definision?.flatMap((def) => def.windows) ?? []) {
      widnows.set(window.windowId, window);
    }
    return widnows;
  },
}

export type PaletteEntry = {
  paletteEntryID: number;
  luminance: number;
  colorDifferenceRed: number;
  colorDifferenceBlue: number;
  transparency: number;
}
export const PaletteEntry = {
  from(stream: ByteStream): PaletteEntry {
    const paletteEntryID = stream.readU8();
    const luminance = stream.readU8();
    const colorDifferenceRed = stream.readU8();
    const colorDifferenceBlue = stream.readU8();
    const transparency = stream.readU8();

    return {
      paletteEntryID,
      luminance,
      colorDifferenceRed,
      colorDifferenceBlue,
      transparency,
    };
  }
}

export type PaletteDefinitionSegment = {
  paletteID: number;
  paletteVersionNumber: number;
  paletteEntries: PaletteEntry[];
}
export const PaletteDefinitionSegment = {
  from(stream: ByteStream): PaletteDefinitionSegment {
    const paletteID = stream.readU8()
    const paletteVersionNumber = stream.readU8()
    const paletteEntries: PaletteEntry[] = [];
    while (!stream.isEmpty()) {
      paletteEntries.push(PaletteEntry.from(stream));
    }

    return {
      paletteID,
      paletteVersionNumber,
      paletteEntries,
    };
  }
}

export const SequenceFlag = {
  LastInSequence: 0x40,
  FirstInSequence: 0x80,
  FirstAndLastInSequence: 0xC0,
  IntermediateSequence: 0x00
} as const;

type ObjectDefinitionSegmentFirstInSequence = {
  objectId: number;
  objectVersionNumber: number;
  lastInSequenceFlag: typeof SequenceFlag.FirstInSequence | typeof SequenceFlag.FirstAndLastInSequence;
  objectDataLength: number;
  width: number;
  height: number;
  objectData: ArrayBuffer;
}
type ObjectDefinitionSegmentOtherSequence = {
  objectId: number;
  objectVersionNumber: number;
  lastInSequenceFlag: typeof SequenceFlag.LastInSequence | typeof SequenceFlag.IntermediateSequence;
  objectData: ArrayBuffer;
}

export type ObjectDefinitionSegment = ObjectDefinitionSegmentFirstInSequence | ObjectDefinitionSegmentOtherSequence

export const ObjectDefinitionSegment = {
  from(stream: ByteStream): ObjectDefinitionSegment {
    const objectId = stream.readU16()
    const objectVersionNumber = stream.readU8()
    const lastInSequenceFlag = stream.readU8()
    if (lastInSequenceFlag === SequenceFlag.FirstInSequence || lastInSequenceFlag === SequenceFlag.FirstAndLastInSequence) {
      const objectDataLength = stream.readU24()
      const width = stream.readU16()
      const height = stream.readU16()
      const objectData = stream.readAll();
      return {
        objectId,
        objectVersionNumber,
        lastInSequenceFlag,
        objectDataLength,
        width,
        height,
        objectData
      };
    } else if (lastInSequenceFlag === SequenceFlag.LastInSequence || lastInSequenceFlag === SequenceFlag.IntermediateSequence) {
      const objectData = stream.readAll();
      return {
        objectId,
        objectVersionNumber,
        lastInSequenceFlag,
        objectData,
      };
    } else {
      throw new ValidationError('lastInSequenceFlag Invalid')
    }
  },
  valueOf(definision?: ObjectDefinitionSegment[]): Map<number, ObjectDefinitionSegment[]> {
    const objects = new Map<number, ObjectDefinitionSegment[]>();
    for (const object of definision ?? []) {
      if (!objects.has(object.objectId)) { objects.set( object.objectId, []); }
      objects.get(object.objectId)!.push(object);
    }
    return objects;
  },
  isFirstInSequence(definision: ObjectDefinitionSegment): definision is ObjectDefinitionSegmentFirstInSequence {
    return definision.lastInSequenceFlag === SequenceFlag.FirstInSequence || definision.lastInSequenceFlag === SequenceFlag.FirstAndLastInSequence
  }
}

export type DecodedObjectDefinitionSegment = {
  objectId: number;
  objectVersionNumber: number;
  objectDataLength: number;
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
}
export const DecodedObjectDefinitionSegment = {
  from(palette: PaletteDefinitionSegment, objects: ObjectDefinitionSegment[]): DecodedObjectDefinitionSegment | null {
    const firstInSequence = objects.find((object) => ObjectDefinitionSegment.isFirstInSequence(object));
    if (firstInSequence == null) { return null; }

    const { width, height } = firstInSequence;
    const rgba = new Uint8ClampedArray(width * height * 4); // RGBA
    const stream = new ByteStream(concat(... objects.map((object) => object.objectData)));

    {
      let offset = 0;
      while (!stream.isEmpty()) {
        const first = stream.readU8();
        let color: PaletteEntry | null = null;
        let length = 1;

        if (first !== 0) {
          color = palette.paletteEntries[first];
        } else {
          const second = stream.readU8();
          if (second === 0) { continue; }

          const color_flag = (second & 0x80) !== 0;
          const length_flag = (second & 0x40) !== 0;

          length = length_flag ? (second & 0x3F) * 2**8 + stream.readU8() : (second & 0x3F);
          color = color_flag ? palette.paletteEntries[stream.readU8()] : palette.paletteEntries[0];
        }

        if (color == null) { offset += length; continue; }

        const [r, g, b] = ycbcr(color.luminance, color.colorDifferenceBlue, color.colorDifferenceRed);
        for (let i = 0; i < length; i++) {
          rgba[offset * 4 + 0] = r; // R
          rgba[offset * 4 + 1] = g; // G
          rgba[offset * 4 + 2] = b; // B
          rgba[offset * 4 + 3] = color.transparency;
          offset += 1;
        }
      }
    }

    return {
      objectId: firstInSequence.objectId,
      objectVersionNumber: firstInSequence.objectVersionNumber,
      objectDataLength: firstInSequence.objectDataLength,
      width,
      height,
      rgba
    };
  },
  valueOf(palette: PaletteDefinitionSegment, definision?: ObjectDefinitionSegment[]): Map<number, DecodedObjectDefinitionSegment> {
    const objects = new Map<number, DecodedObjectDefinitionSegment>();

    for (const objs of ObjectDefinitionSegment.valueOf(definision).values()) {
      const decoded = DecodedObjectDefinitionSegment.from(palette, objs);
      if (decoded == null) { continue; }

      objects.set(decoded.objectId, decoded);
    }

    return objects;
  }
}

export type Segment = {
  type: typeof SegmentType.PDS;
  segment: PaletteDefinitionSegment;
} | {
  type: typeof SegmentType.ODS;
  segment: ObjectDefinitionSegment;
} | {
  type: typeof SegmentType.PCS;
  segment: PresentationCompositionSegment;
} | {
  type: typeof SegmentType.WDS;
  segment: WindowDefinitionSegment
} | {
  type: typeof SegmentType.END
};
export const Segment = {
  from(stream: ByteStream): Segment {
    const segmentType = stream.readU8();
    const segmentSize = stream.readU16();

    switch (segmentType) {
      case SegmentType.PDS:
        return {
          type: SegmentType.PDS,
          segment: PaletteDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
        };
      case SegmentType.ODS:
        return {
          type: SegmentType.ODS,
          segment: ObjectDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
        };
      case SegmentType.PCS:
        return {
          type: SegmentType.PCS,
          segment: PresentationCompositionSegment.from(new ByteStream(stream.read(segmentSize))),
        };
      case SegmentType.WDS:
        return {
          type: SegmentType.WDS,
          segment: WindowDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
        };
      case SegmentType.END:
        return {
          type: SegmentType.END,
        };
      default:
        throw new ValidationError(`Unrecognized SegmentType: ${segmentType}`);
    }
  },
  async fromAsync(stream: AsyncByteStream): Promise<Segment> {
    const segmentType = await stream.readU8();
    const segmentSize = await stream.readU16();

    if (!(await stream.exists(segmentSize))) {
      throw new EOFError(`Insufficient SegmentLength!`);
    }

    switch (segmentType) {
      case SegmentType.PDS:
        return {
          type: SegmentType.PDS,
          segment: PaletteDefinitionSegment.from(new ByteStream(await stream.read(segmentSize))),
        };
      case SegmentType.ODS:
        return {
          type: SegmentType.ODS,
          segment: ObjectDefinitionSegment.from(new ByteStream(await stream.read(segmentSize))),
        };
      case SegmentType.PCS:
        return {
          type: SegmentType.PCS,
          segment: PresentationCompositionSegment.from(new ByteStream(await stream.read(segmentSize))),
        };
      case SegmentType.WDS:
        return {
          type: SegmentType.WDS,
          segment: WindowDefinitionSegment.from(new ByteStream(await stream.read(segmentSize))),
        };
      case SegmentType.END:
        return {
          type: SegmentType.END,
        };
      default:
        throw new ValidationError(`Unrecognized SegmentType: ${segmentType}`);
    }
  }
}

export const HeaderLengthByFormat = {
  SUP: 13,
  MPEGTS: 5,
};
export type TimestampedSegment = Segment & {
  pts: number;
  dts: number;
  timescale: number;
};
export const TimestampedSegment = {
  fromSUPFormat(stream: ByteStream): TimestampedSegment {
    const magic = stream.readU16();
    if (magic !== 0x5047) { throw new ValidationError('Magic Number not Found!'); }
    const pts = stream.readU32();
    const dts = stream.readU32();
    const timescale = 90000;
    const segment = Segment.from(stream);

    return {
      ... segment,
      pts,
      dts,
      timescale
    };
  },
  async fromSUPFormatAsync(stream: AsyncByteStream): Promise<TimestampedSegment> {
    const magic = await stream.readU16();
    if (magic !== 0x5047) { throw new ValidationError('Magic Number not Found!'); }
    const pts = await stream.readU32();
    const dts = await stream.readU32();
    const timescale = 90000;
    const segment = await Segment.fromAsync(stream);

    return {
      ... segment,
      pts,
      dts,
      timescale
    };
  },
  fromMpegTSFormat(stream: ByteStream, pts: number, dts: number): TimestampedSegment {
    const magic = stream.readU16();
    if (magic !== 0x5047) { throw new ValidationError('Magic Number not Found!'); }
    const timescale = 90000;
    const segment = Segment.from(stream);

    return {
      ... segment,
      pts,
      dts,
      timescale
    };
  },
  async fromMpegTSFormatAsync(stream: AsyncByteStream, pts: number, dts: number): Promise<TimestampedSegment> {
    const magic = await stream.readU16();
    if (magic !== 0x5047) { throw new ValidationError('Magic Number not Found!'); }
    const timescale = 90000;
    const segment = await Segment.fromAsync(stream);

    return {
      ... segment,
      pts,
      dts,
      timescale
    };
  },
  *iterateSupFormat(buffer: ArrayBuffer): Iterable<TimestampedSegment> {
    const stream = new ByteStream(buffer);
    while(!stream.isEmpty()) {
      yield this.fromSUPFormat(stream);
    }
  },
  async *iterateSupFormatAsync(async: ReadableStream): AsyncIterable<TimestampedSegment> {
    const stream = new AsyncByteStream(async);
    while(await stream.exists(HeaderLengthByFormat.SUP)) {
      yield this.fromSUPFormatAsync(stream);
    }
  },
  *iterateMpegTSFormat(buffer: ArrayBuffer, pts: number, dts: number): Iterable<TimestampedSegment> {
    const stream = new ByteStream(buffer);
    while(!stream.isEmpty()) {
      yield this.fromMpegTSFormat(stream, pts, dts);
    }
  },
  async *iterateMpegTSFormatAsync(readable: ReadableStream, pts: number, dts: number): AsyncIterable<TimestampedSegment> {
    const stream = new AsyncByteStream(readable);
    while(await stream.exists(HeaderLengthByFormat.MPEGTS)) {
      yield this.fromMpegTSFormatAsync(stream, pts, dts);
    }
  }
}

type DisplaySetRequiredSegment = {
  PCS: PresentationCompositionSegment;
};

type DisplaySetOptionalSegments = {
  PDS: PaletteDefinitionSegment;
  WDS: WindowDefinitionSegment;
  ODS: ObjectDefinitionSegment[];
};

type DisplaySetIntraInformation = {
  compositionState: typeof CompositionState.AcquisitionPoint | typeof CompositionState.EpochStart;
} & DisplaySetRequiredSegment & DisplaySetOptionalSegments;

type DisplaySetNormalInformation = {
  compositionState: typeof CompositionState.Normal;
} & DisplaySetRequiredSegment & Partial<DisplaySetOptionalSegments>;

type DisplaySetSelfContained = {
  compositionState: (typeof CompositionState)[keyof typeof CompositionState];
  composition: PresentationCompositionSegment;
  palette: PaletteDefinitionSegment;
  windows: Map<number, WindowDefinition>;
  objects: Map<number, ObjectDefinitionSegment[]> | Map<number, DecodedObjectDefinitionSegment>;
}
export type DisplaySet = {
  pts: number;
  timescale: number;
} & (
  DisplaySetIntraInformation | DisplaySetNormalInformation
);
export const DisplaySet = {
  from(segments: TimestampedSegment[]): DisplaySet {
    const pcses = segments.filter((segment) => segment.type === SegmentType.PCS);
    if (pcses.length === 0) {
      throw new ValidationError('PCS not Found!');
    } else if (pcses.length >= 2) {
      throw new ValidationError('Duplicated PCS in DisplaySet!');
    }
    const pcs = pcses[0];

    const pds = segments.filter((segment) => segment.type === SegmentType.PDS).find(segment => segment.segment.paletteID === pcs.segment.paletteId);
    const wds = segments.filter((segment) => segment.type === SegmentType.WDS)[0];
    const odses = segments.filter((segment) => segment.type === SegmentType.ODS);

    if (pcs.segment.compositionState == CompositionState.Normal) {
      return {
        pts: pcs.pts,
        timescale: pcs.timescale,
        compositionState: pcs.segment.compositionState,
        PCS: pcs.segment,
        PDS: pds?.segment,
        WDS: wds?.segment,
        ODS: odses.map(ods => ods.segment)
      };
    } else {
      if (pds == null) {
        throw new ValidationError('PDS not Found!');
      }

      return {
        pts: pcs.pts,
        timescale: pcs.timescale,
        compositionState: pcs.segment.compositionState,
        PCS: pcs.segment,
        PDS: pds.segment,
        WDS: wds.segment,
        ODS: odses.map(ods => ods.segment)
      };
    }
  },
  *aggregate(iterator: Iterable<TimestampedSegment>): Iterable<DisplaySet> {
    let segments: TimestampedSegment[] | null = null;

    for (const segment of iterator) {
      if (segment.type === SegmentType.PCS) {
        segments = [];
      }
      if (segments == null) { continue; }

      if (segment.type !== SegmentType.END) {
        segments.push(segment);
      } else {
        yield this.from(segments);
        segments = null;
      }
    }
    if (segments != null) { yield this.from(segments); }
  },
  async *aggregateAsync(iterator: AsyncIterable<TimestampedSegment>): AsyncIterable<DisplaySet> {
    let segments: TimestampedSegment[] | null = null;

    for await (const segment of iterator) {
      if (segment.type === SegmentType.PCS) {
        segments = [];
      }
      if (segments == null) { continue; }

      if (segment.type !== SegmentType.END) {
        segments.push(segment);
      } else {
        yield this.from(segments);
        segments = null;
      }
    }
    if (segments != null) { yield this.from(segments); }
  },
}

export type AcquisitionPoint = {
  pts: number;
  timescale: number;
} & DisplaySetSelfContained;
export const AcquisitionPoint = {
  from(displaysets: DisplaySet[], decode = false): AcquisitionPoint[] {
    const acquisitions: AcquisitionPoint[] = [];
    let reference: DisplaySet | null = null;
    for (const displayset of displaysets) {
      if (displayset.compositionState === CompositionState.EpochStart || displayset.compositionState === CompositionState.AcquisitionPoint) {
        reference = displayset;
      }
      if (reference == null) { continue; }

      const composition = displayset.PCS;
      const palette = reference.PDS;

      if (composition.compositionObjects.length === 0) { // End of Epoch
        acquisitions.push({
          pts: displayset.pts,
          timescale: displayset.timescale,
          compositionState: displayset.compositionState,
          composition,
          palette,
          windows: new Map<number, WindowDefinition>(),
          objects: new Map<number, ObjectDefinitionSegment[]>(),
        });
        continue;
      }

      const windows = WindowDefinitionSegment.valueOf([reference.WDS, ... (displayset.WDS ? [displayset.WDS] : [])]);
      const ods = [... reference.ODS, ... (displayset.ODS ? displayset.ODS : [])];
      const objects = decode ? DecodedObjectDefinitionSegment.valueOf(palette, ods) : ObjectDefinitionSegment.valueOf(ods);

      acquisitions.push({
        pts: displayset.pts,
        timescale: displayset.timescale,
        compositionState: displayset.compositionState,
        composition,
        palette,
        windows,
        objects,
      });
    }

    return acquisitions;
  },
  *iterate(iterator: Iterable<DisplaySet>, decode = false): Iterable<AcquisitionPoint> {
    let displaysets: DisplaySet[] = [];

    for (const displayset of iterator) {
      if (displayset.compositionState === CompositionState.EpochStart || displayset.compositionState === CompositionState.AcquisitionPoint) {
        if (displaysets.length > 0) {
          yield* AcquisitionPoint.from(displaysets, decode);
        }
        displaysets = [];
      }
      displaysets.push(displayset);
    }
    if (displaysets.length > 0) { yield* AcquisitionPoint.from(displaysets); }
  },
  async *iterateAsync(iterator: AsyncIterable<DisplaySet>, decode = false): AsyncIterable<AcquisitionPoint> {
    let displaysets: DisplaySet[] = [];

    for await (const displayset of iterator) {
      if (displayset.compositionState === CompositionState.EpochStart || displayset.compositionState === CompositionState.AcquisitionPoint) {
        if (displaysets.length > 0) {
          yield* AcquisitionPoint.from(displaysets, decode);
        }
        displaysets = [];
      }
      displaysets.push(displayset);
    }
    if (displaysets.length > 0) { yield* AcquisitionPoint.from(displaysets); }
  },
}

export type Epoch = {
  displaySets: DisplaySetSelfContained[];
}
