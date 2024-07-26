import { AcquisitionPoint } from "../../pgs/type";
import decode from "./decode";

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

const render = (acquisition: AcquisitionPoint, context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D) => {
  const { composition, palette, objects, windows } = acquisition;

  for (const compobisionObject of composition.compositionObjects) {
    const object = objects.get(compobisionObject.objectId);
    const window = windows.get(compobisionObject.windowId);
    if (object == null || window == null) { continue; }

    const data = decode(palette, object);
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
}

export type ImageBitmapForAcquisitionPoint= {
  pts: number;
  timescale: number;
  bitmap: ImageBitmap;
};
export const ImageBitmapForAcquisitionPoint = {
  from(acquisition: AcquisitionPoint): ImageBitmapForAcquisitionPoint | null {
    const { composition } = acquisition;
    const { width, height }= composition;

    if (typeof OffscreenCanvas === 'undefined') { return null; }
    const canvas = new OffscreenCanvas(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
    if (!context) { return null; }

    render(acquisition, context);

    return {
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      bitmap: canvas.transferToImageBitmap(),
    };
  },
  async fromAsync(acquisition: AcquisitionPoint, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): Promise<ImageBitmapForAcquisitionPoint | null> {
    const { composition } = acquisition;
    const { width, height }= composition;

    const canvas = canvasFactoryFunction(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
    if (!context) { return null; }

    render(acquisition, context);

    return {
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      bitmap: await createImageBitmap(canvas)
    };
  },
}

export type CanvasForAcquisitionPoint= {
  pts: number;
  timescale: number;
  canvas: OffscreenCanvas | HTMLCanvasElement;
};
export const CanvasForAcquisitionPoint = {
  from(acquisition: AcquisitionPoint, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): CanvasForAcquisitionPoint | null {
    const { composition } = acquisition;
    const { width, height }= composition;

    const canvas = canvasFactoryFunction(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
    if (!context) { return null; }

    render(acquisition, context);

    return {
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      canvas,
    };
  },
}
