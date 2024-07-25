import { ByteStream } from "../util/bytestream"
import EOFError from "../util/eof";
import ValidationError from "./common/error";
import { ObjectDefinitionSegment, PaletteDefinitionSegment, PresentationCompositionSegment, TimestampedSegment, SegmentType, WindowDefinitionSegment } from "./common/type"

export default (pes: ArrayBuffer, pts: number, dts: number): TimestampedSegment[] => {
  const stream = new ByteStream(pes);
  const segments: TimestampedSegment[] = [];

  try {
    while(!stream.isEmpty()) {
      stream.readU16();
      const timescale = 90000;
      const segmentType = stream.readU8();
      const segmentSize = stream.readU16();

      switch (segmentType) {
        case SegmentType.PDS:
          segments.push({
            type: SegmentType.PDS,
            segment: PaletteDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
            pts,
            dts,
            timescale,
          });
          break;
        case SegmentType.ODS:
          segments.push({
            type: SegmentType.ODS,
            segment: ObjectDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
            pts,
            dts,
            timescale,
          });
          break;
        case SegmentType.PCS:
          segments.push({
            type: SegmentType.PCS,
            segment: PresentationCompositionSegment.from(new ByteStream(stream.read(segmentSize))),
            pts,
            dts,
            timescale,
          });
          break;
        case SegmentType.WDS:
          segments.push({
            type: SegmentType.WDS,
            segment: WindowDefinitionSegment.from(new ByteStream(stream.read(segmentSize))),
            pts,
            dts,
            timescale,
          });
          break;
        case SegmentType.END:
          segments.push({
            type: SegmentType.END,
            pts,
            dts,
            timescale,
          });
          break;
        default:
          break;
      }
    }
  } catch (e) {
    if (e instanceof EOFError) {
      console.error("EOF Occured", e);
    } else if (e instanceof ValidationError) {
      console.error("Validation Error Occured", e);
    }
  }

  return segments;
}
