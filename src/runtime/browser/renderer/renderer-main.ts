import { AcquisitionPoint } from "../../../pgs/type";

import PGSRenderer from "./renderer";
import { CanvasForAcquisitionPoint, preferHTMLCanvasElement, preferOffscreenCanvas } from "../render";
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

    const data = CanvasForAcquisitionPoint.from(pgs, this.option.preferHTMLCanvasElement ? preferHTMLCanvasElement : preferOffscreenCanvas);
    if (!data) {
      this.clear();
      return;
    }

    const { canvas } = data;
    if (this.canvas.width !== canvas.width || this.canvas.height !== canvas.width) {
      this.canvas.width = canvas.width;
      this.canvas.height = canvas.height;
    }
    this.clear();
    darwImageByOption(canvas, this.canvas, this.option);
  }
}