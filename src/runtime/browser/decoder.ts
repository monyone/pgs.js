import { AcquisitionPoint, ObjectDefinitionSegment, PaletteDefinitionSegment, PaletteEntry } from "../../pgs/type";
import ByteStream from "../../util/bytestream";
import concat from "../../util/concat";
import ycbcr from "../../util/ycbcr";

const preferOffscreenCanvas = (width: number, height: number): OffscreenCanvas | HTMLCanvasElement | null => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  return null; // Unsupported!
}

const decodeObject = (palette: PaletteDefinitionSegment, object: ObjectDefinitionSegment[]): ImageData | null => {
  if (object.length === 0) { return null; }

  const stream = new ByteStream(concat(object.map((obj) => obj.objectData)));
  const firstInSequence = object.find((obj) => ObjectDefinitionSegment.isFirstInSequence(obj));
  if (firstInSequence == null) { return null; }
  const { width, height } = firstInSequence;

  const data = new Uint8ClampedArray(width * height * 4); // RGBA

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
        data[offset * 4 + 0] = r; // R
        data[offset * 4 + 1] = g; // G
        data[offset * 4 + 2] = b; // B
        data[offset * 4 + 3] = color.transparency;
        offset += 1;
      }
    }
  }

  return new ImageData(data, width, height);
};

export default (pgs: Readonly<AcquisitionPoint>): OffscreenCanvas | HTMLCanvasElement | null => {
  const { composition, palette, objects, windows } = pgs;
  const { width, height }= composition;

  const canvas = preferOffscreenCanvas(width, height);
  if (!canvas) { return null; }
  const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
  if (!context) { return null; }

  for (const compobisionObject of composition.compositionObjects) {
    const object = objects.get(compobisionObject.objectId);
    const window = windows.get(compobisionObject.windowId);
    if (object == null || window == null) { continue; }

    const data = decodeObject(palette, object);
    if (data == null) { continue; }

    const x = window.windowHorizontalPosition;
    const y = window.windowVerticalPosition;
    if (compobisionObject.objectCroppedFlag) {
      const dirtyX = compobisionObject.objectCroppingHorizontalPosition;
      const dirtyY = compobisionObject.objectCroppingVerticalPosition;
      const dirtyWidth = compobisionObject.objectCroppingWidth;
      const dirtyHeight = compobisionObject.objectCroppingHeight;
      context.putImageData(data, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    } else {
      context.putImageData(data, x, y);
    }
  }

  return canvas;
}

