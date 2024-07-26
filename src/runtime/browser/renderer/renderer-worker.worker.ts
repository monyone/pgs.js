import { ImageBitmapForAcquisitionPoint } from "../render";
import { FromMainToWorkerEvent, FromWorkerToMainEventRendered } from "./renderer-worker.event";

self.addEventListener('message', (event: MessageEvent<FromMainToWorkerEvent>) => {
  switch (event.data.type) {
    case 'render': {
      const { pgs } = event.data;
      const data = ImageBitmapForAcquisitionPoint.from(pgs);
      if (!data) {
        (self as any).postMessage(FromWorkerToMainEventRendered.from());
        return;
      }

      const { bitmap } = data;
      (self as any).postMessage(FromWorkerToMainEventRendered.from(bitmap), [bitmap]);

      break;
    }
    default: {
      const exhaustive: never = event.data.type;
      throw new Error(`Exhaustive check: ${exhaustive} reached!`);
    }
  }
});

