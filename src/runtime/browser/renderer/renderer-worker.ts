import { AcquisitionPointForRender } from "../render";

import PGSRenderer from "./renderer";
import { PGSRenderOption } from "./renderer-option";
import { FromMainToWorkerEventRender, FromWorkerToMainEvent } from "./renderer-worker.event";
import DecodeWorker from "./renderer-worker.worker?worker&inline";

export default class PGSWorkerThraedRenderer<T extends HTMLCanvasElement | OffscreenCanvas> extends PGSRenderer<T> {
  private worker: Worker;
  private readonly renderedHandler = this.rendered.bind(this);

  public constructor(option?: Partial<PGSRenderOption>) {
    super(option);
    this.worker = new DecodeWorker();
    this.worker.addEventListener('message', this.renderedHandler);
  }

  public render(acquisition: Readonly<AcquisitionPointForRender>): void {
    switch (acquisition.type) {
      case 'none':
        this.worker.postMessage(FromMainToWorkerEventRender.from(acquisition));
        break;
      case 'bitmap':
        this.draw(acquisition.bitmap);
        break;
      case 'canvas':
        this.draw(acquisition.canvas);
        break;
      default: {
        const exhaustive: never = acquisition;
        throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
  }

  private draw(source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas) {
    if (this.canvas == null) { return; }
    const context = this.getContext2D();
    if (!context) { return; }

    if (this.canvas.width !== source.width || this.canvas.height !== source.width) {
      this.canvas.width = source.width;
      this.canvas.height = source.height;
    }
    this.clear();
    context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }

  private rendered(event: MessageEvent<FromWorkerToMainEvent>) {
    switch (event.data.type) {
      case 'rendered': {
        const { bitmap } = event.data;
        if (bitmap == null) {
          this.clear();
          return;
        }

        this.draw(bitmap);
        bitmap.close();
        break;
      }
      default: {
        const exhaustive: never = event.data.type;
        throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
  }

  public destroy(): void {
    super.destroy();
    this.worker.terminate();
  }
}
