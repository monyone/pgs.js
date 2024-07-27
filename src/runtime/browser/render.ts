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

export type AcquisitionPointNotRendered = AcquisitionPoint & {
  type: 'none';
};
export const AcquisitionPointNotRendered = {
  from(acquisition: AcquisitionPoint): AcquisitionPointNotRendered {
    return {
      type: 'none',
      ... acquisition
    };
  },
  *iterate(iterator: Iterable<AcquisitionPoint>): Iterable<AcquisitionPointNotRendered> {
    for (const acquisition of iterator) {
      const to = AcquisitionPointNotRendered.from(acquisition);
      if (to == null ){ return; }
      yield to;
    }
  },
};

export type AcquisitionPointRenderedImageBitmap = {
  type: 'bitmap';
  pts: number;
  timescale: number;
  bitmap: ImageBitmap;
};
export const AcquisitionPointRenderedImageBitmap = {
  from(acquisition: AcquisitionPoint): AcquisitionPointRenderedImageBitmap | null {
    const { composition } = acquisition;
    const { width, height }= composition;

    if (typeof OffscreenCanvas === 'undefined') { return null; }
    const canvas = new OffscreenCanvas(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d');
    if (!context) { return null; }

    render(acquisition, context);

    return {
      type: 'bitmap',
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      bitmap: canvas.transferToImageBitmap(),
    };
  },
  async fromAsync(acquisition: AcquisitionPoint, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): Promise<AcquisitionPointRenderedImageBitmap | null> {
    const { composition } = acquisition;
    const { width, height }= composition;

    const canvas = canvasFactoryFunction(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
    if (!context) { return null; }

    render(acquisition, context);

    return {
      type: 'bitmap',
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      bitmap: await createImageBitmap(canvas)
    };
  },
  *iterate(iterator: Iterable<AcquisitionPoint>): Iterable<AcquisitionPointRenderedImageBitmap> {
    for (const acquisition of iterator) {
      const rendered = AcquisitionPointRenderedImageBitmap.from(acquisition);
      if (rendered == null ){ return; }
      yield rendered;
    }
  },
  async *iterateAsync(iterator: AsyncIterable<AcquisitionPoint>, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): AsyncIterable<AcquisitionPointRenderedImageBitmap> {
    for await (const acquisition of iterator) {
      const rendered = await AcquisitionPointRenderedImageBitmap.fromAsync(acquisition, canvasFactoryFunction);
      if (rendered == null ){ return; }
      yield rendered;
    }
  },
}

export type AcquisitionPointRenderedCanvas = {
  type: 'canvas';
  pts: number;
  timescale: number;
  canvas: OffscreenCanvas | HTMLCanvasElement;
};
export const AcquisitionPointRenderedCanvas = {
  from(acquisition: AcquisitionPoint, canvasFactoryFunction: CanvasFactoryFunction = preferOffscreenCanvas): AcquisitionPointRenderedCanvas | null {
    const { composition } = acquisition;
    const { width, height }= composition;

    const canvas = canvasFactoryFunction(width, height);
    if (!canvas) { return null; }
    const context = canvas.getContext('2d') as (OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null);
    if (!context) { return null; }

    render(acquisition, context);

    return {
      type: 'canvas',
      pts: acquisition.pts,
      timescale: acquisition.timescale,
      canvas,
    };
  },
}

export type AcquisitionPointForRender = AcquisitionPointNotRendered | AcquisitionPointRenderedImageBitmap | AcquisitionPointRenderedCanvas;
