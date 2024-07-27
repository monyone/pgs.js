import { AcquisitionPoint } from "../../../pgs/type";

import PGSRenderer from "./renderer";
import { PGSRenderOption } from "./renderer-option";
import { darwImageByOption } from "./renderer-utils";
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

  public render(pgs: Readonly<AcquisitionPoint>): void {
    this.worker.postMessage(FromMainToWorkerEventRender.from(pgs));
  }

  private rendered(event: MessageEvent<FromWorkerToMainEvent>) {
    switch (event.data.type) {
      case 'rendered': {
        if (this.canvas == null) { return; }
        const context = this.getContext2D();
        if (!context) { return; }

        const { bitmap } = event.data;
        if (bitmap == null) {
          this.clear();
          return;
        }

        if (this.canvas.width !== bitmap.width || this.canvas.height !== bitmap.width) {
          this.canvas.width = bitmap.width;
          this.canvas.height = bitmap.height;
        }
        this.clear();
        darwImageByOption(bitmap, this.canvas, this.option);

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