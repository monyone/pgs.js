import { DecodedObjectDefinitionSegment, ObjectDefinitionSegment, PaletteDefinitionSegment } from "../../pgs/type";

export default (palette: PaletteDefinitionSegment, object: ObjectDefinitionSegment[] | DecodedObjectDefinitionSegment | null): ImageData | null => {
  if (object == null) { return null; }
  if (!Array.isArray(object)) {
    return new ImageData(object.rgba, object.width, object.height);
  }

  const result = DecodedObjectDefinitionSegment.from(palette, object);
  if (result == null) { return null; }
  return new ImageData(result.rgba, result.width, result.height);
};
