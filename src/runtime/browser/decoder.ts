import { AcquisitionPoint, DecodedObjectDefinitionSegment, ObjectDefinitionSegment, PaletteDefinitionSegment } from "../../pgs/common/type";

export const preferOffscreenCanvas = (width: number, height: number): OffscreenCanvas | HTMLCanvasElement | null => {
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

export const preferHTMLCanvasElement = (width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null => {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  return null; // Unsupported!
}

export type CanvasFactoryFunction = typeof preferOffscreenCanvas | typeof preferHTMLCanvasElement;

const decodeObject = (palette: PaletteDefinitionSegment, object: ObjectDefinitionSegment[] | DecodedObjectDefinitionSegment | null): ImageData | null => {
  if (object == null) { return null; }
  if (!Array.isArray(object)) {
    return new ImageData(object.rgba, object.width, object.height);
  }

  const result = DecodedObjectDefinitionSegment.from(palette, object);
  if (result == null) { return null; }
  return new ImageData(result.rgba, result.width, result.height);
};

export default (pgs: Readonly<AcquisitionPoint>, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): OffscreenCanvas | HTMLCanvasElement | null => {
  const { composition, palette, objects, windows } = pgs;
  const { width, height }= composition;

  const canvas = canvasFactoryFunction(width, height);
  if (!canvas) { return null; }
  const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
  if (!context) { return null; }

  for (const compobisionObject of composition.compositionObjects) {
    const object = objects.get(compobisionObject.objectId);
    const window = windows.get(compobisionObject.windowId);
    if (object == null || window == null) { continue; }

    const data = decodeObject(palette, object);
    if (data == null) { continue; }

    context.save();
    const path = new Path2D();
    path.rect(window.windowHorizontalPosition, window.windowVerticalPosition, window.windowWidth, window.windowHeight);
    context.clip(path);

    const x = compobisionObject.objectHorizontalPosition;
    const y = compobisionObject.objectVerticalPosition;
    if (compobisionObject.objectCroppedFlag) {
      const dirtyX = compobisionObject.objectCroppingHorizontalPosition;
      const dirtyY = compobisionObject.objectCroppingVerticalPosition;
      const dirtyWidth = compobisionObject.objectCroppingWidth;
      const dirtyHeight = compobisionObject.objectCroppingHeight;
      context.putImageData(data, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    } else {
      context.putImageData(data, x, y);
    }

    context.restore();
  }

  return canvas;
}
