import { RenderOption } from "./renderer-option";

export const getContext2D = (src: HTMLCanvasElement | OffscreenCanvas): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null => {
  if (src == null) { return null; }

  // Omit False Positive ImageBitmapRenderingContext type
  return src.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
}

export const renderByOption = (src: HTMLCanvasElement | OffscreenCanvas | ImageBitmap, dst: HTMLCanvasElement | OffscreenCanvas, option: RenderOption): void => {
  const context = getContext2D(dst);
  if (context == null) { return; }

  switch (option.objectFit) {
    case 'fill': {
      context.drawImage(src, 0, 0, dst.width, dst.height);
      break;
    }
    case 'contain': {
      const magnification = Math.min(dst.width / src.width, dst.height / src.height);
      const width = src.width * magnification;
      const height = src.height * magnification;
      const x_margin = (dst.width - width) / 2;
      const y_margin = (dst.height - height) / 2;
      context.drawImage(src, 0, 0, src.width, src.height, x_margin, y_margin, width, height);
      break;
    }
    case 'cover': {
      const magnification = Math.max(dst.width / src.width, dst.height / src.height);
      const width = src.width * magnification;
      const height = src.height * magnification;
      const x_margin = (dst.width - width) / 2;
      const y_margin = (dst.height - height) / 2;
      context.drawImage(src, 0, 0, src.width, src.height, x_margin, y_margin, width, height);
      break;
    }
    case 'none': {
      const width = src.width;
      const height = src.height;
      const x_margin = (dst.width - width) / 2;
      const y_margin = (dst.height - height) / 2;
      context.drawImage(src, 0, 0, src.width, src.height, x_margin, y_margin, width, height);
      break;
    }
    case 'scale-down': {
      const magnification = Math.min(dst.width / src.width, dst.height / src.height);
      const width = Math.min(src.width * magnification, src.width);
      const height = Math.min(src.height * magnification, src.height);
      const x_margin = (dst.width - width) / 2;
      const y_margin = (dst.height - height) / 2;
      context.drawImage(src, 0, 0, src.width, src.height, x_margin, y_margin, width, height);
      break;
    }
    default: {
      const exhaustive: never = option.objectFit;
      throw new Error(`Exhaustive check: ${exhaustive} reached!`);
    }
  }
}
