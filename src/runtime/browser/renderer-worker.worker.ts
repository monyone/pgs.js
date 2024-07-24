import decode from "./decoder";
import { FromMainToWorkerEvent, FromWorkerToMainEventRendered } from "./renderer-worker.event";

self.addEventListener('message', (event: MessageEvent<FromMainToWorkerEvent>) => {
  switch (event.data.type) {
    case 'render': {
      const { pgs } = event.data;
      const source = decode(pgs) as OffscreenCanvas | null; // Omit HTMLCanvasElement does not in WebWorker!
      if (!source) { return; }

      const bitmap = source.transferToImageBitmap();
      (self as any).postMessage(FromWorkerToMainEventRendered.from(bitmap), [bitmap]);

      break;
    }
    default: {
      const exhaustive: never = event.data.type;
      throw new Error(`Exhaustive check: ${exhaustive} reached!`);
    }
  }
});

