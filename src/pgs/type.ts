import ByteStream from "../util/bytestream";
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

export type TimestampedSegment = Segment & {
  pts: number;
  dts: number;
  timescale: number;
};

type DisplaySetRequiredSegment = {
  PCS: PresentationCompositionSegment;
}

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
  objects: Map<number, ObjectDefinitionSegment[]>;
}
export type DisplaySet = {
  pts: number;
  timescale: number;
} & (
  DisplaySetIntraInformation | DisplaySetNormalInformation
);

export type AcquisitionPoint = {
  pts: number;
  timescale: number;
} & DisplaySetSelfContained;

export type Epoch = {
  displaySets: DisplaySetSelfContained[];
}
