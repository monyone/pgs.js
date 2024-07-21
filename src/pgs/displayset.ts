import ValidationError from "./error";
import { TimestampedSegment, DisplaySet, SegmentType, CompositionState } from "./type"

export default (segments: TimestampedSegment[]): DisplaySet[] => {
  const sets: TimestampedSegment[][] = [[]];
  let added = false;
  for (const segment of segments) {
    if (segment.type === SegmentType.END) {
      added = true;
      continue;
    }

    if (added) { sets.push([]); added = false; }
    sets.at(-1)!.push(segment);
  }

  const displayset: DisplaySet[] = [];
  for (const set of sets) {
    const pcses = set.filter(segment => segment.type === SegmentType.PCS);
    if (pcses.length === 0) {
      throw new ValidationError('PCS not Found!');
    } else if (pcses.length >= 2) {
      throw new ValidationError('Duplicated PCS in DisplaySet!');
    }
    const pcs = pcses[0];

    const pds = set.filter(segment => segment.type === SegmentType.PDS).find(segment => segment.segment.paletteID === pcs.segment.paletteId);
    const wds = set.filter(segment => segment.type === SegmentType.WDS)[0];
    const odses = set.filter(segment => segment.type === SegmentType.ODS);

    if (pcs.segment.compositionState == CompositionState.Normal) {
      displayset.push({
        pts: pcs.pts,
        timescale: pcs.timescale,
        compositionState: pcs.segment.compositionState,
        PCS: pcs.segment,
        PDS: pds?.segment,
        WDS: wds?.segment,
        ODS: odses.map(ods => ods.segment)
      });
    } else {
      if (pds == null) {
        throw new ValidationError('PDS not Found!');
      }

      displayset.push({
        pts: pcs.pts,
        timescale: pcs.timescale,
        compositionState: pcs.segment.compositionState,
        PCS: pcs.segment,
        PDS: pds.segment,
        WDS: wds.segment,
        ODS: odses.map(ods => ods.segment)
      });
    }
  }

  return displayset;
}
