import { AcquisitionPoint } from "../../pgs/common/type";

import PGSRenderer from "./renderer";
import decode, { preferHTMLCanvasElement, preferOffscreenCanvas } from "./decoder";
import { darwImageByOption } from "./renderer-utils";
import { PGSRenderOption } from "./renderer-option";

export default class PGSMainThraedRenderer<T extends HTMLCanvasElement | OffscreenCanvas> extends PGSRenderer<T> {

  public constructor(option?: Partial<PGSRenderOption>) {
    super(option);
  }

  public render(pgs: Readonly<AcquisitionPoint>): void {
    if (this.canvas == null) { return; }

    // Omit False Positive ImageBitmapRenderingContext type
    const context = this.getContext2D();
    if (!context) { return; }

    const source = decode(pgs, this.option.preferHTMLCanvasElement ? preferHTMLCanvasElement : preferOffscreenCanvas);
    if (!source) {
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    if (this.canvas.width !== source.width || this.canvas.height !== source.width) {
      this.canvas.width = source.width;
      this.canvas.height = source.height;
    }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    darwImageByOption(source, this.canvas, this.option);

    source.width = source.height = 0;
  }
}
