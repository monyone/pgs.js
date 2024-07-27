import PGSRenderer from "./renderer";
import PGSMainThraedRenderer from "./renderer-main";
import { PGSRenderOption } from "./renderer-option";
import PGSWorkerThraedRenderer from "./renderer-worker";

export const getContext2D = (src: HTMLCanvasElement | OffscreenCanvas): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null => {
  if (src == null) { return null; }

  // Omit False Positive ImageBitmapRenderingContext type
  return src.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
}

export const selectRendererByOption = <T extends HTMLCanvasElement | OffscreenCanvas>(option: PGSRenderOption): PGSRenderer<T> => {
  if (option.webWorker) {
    return new PGSWorkerThraedRenderer<T>(option);
  } else {
    return new PGSMainThraedRenderer<T>(option);
  }
}
