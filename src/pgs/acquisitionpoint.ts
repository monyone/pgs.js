import ValidationError from "./error";
import { DisplaySet, CompositionState, AcquisitionPoint, WindowDefinitionSegment, WindowDefinition, ObjectDefinitionSegment, DecodedObjectDefinitionSegment } from "./type"

export default (displaySet: DisplaySet[], decode = false): AcquisitionPoint[] => {
  const acquisitions: DisplaySet[][] = [];
  for (const set of displaySet) {
    if (set.compositionState !== CompositionState.Normal) {
      acquisitions.push([]);
    }
    acquisitions.at(-1)!.push(set);
  }

  const result: AcquisitionPoint[] = [];
  for (const acquisition of acquisitions) {
    for (const displayset of acquisition) {
      const composition = displayset.PCS;
      const palette = acquisition.map((set) => set.PDS).filter((pds) => pds != null).find((pds) => pds.paletteID === composition.paletteId);
      if (palette == null) { throw new ValidationError('palette not found!'); }

      if (composition.compositionObjects.length === 0) { // End of Epoch
        result.push({
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

      const windows = WindowDefinitionSegment.valueOf(acquisition.flatMap((set) => set.WDS).filter(set => set != null));
      const ods = acquisition.flatMap((set) => set.ODS).filter(set => set != null);
      const objects = decode ? DecodedObjectDefinitionSegment.valueOf(palette, ods) : ObjectDefinitionSegment.valueOf(ods);

      result.push({
        pts: displayset.pts,
        timescale: displayset.timescale,
        compositionState: displayset.compositionState,
        composition,
        palette,
        windows,
        objects,
      });
    }
  }

  return result;
}
