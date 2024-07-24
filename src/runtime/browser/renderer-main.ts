import { AcquisitionPoint } from "../../pgs/type";

import PGSRenderer from "./renderer";
import decode from "./decoder";
import { renderByOption } from "./renderer-utils";

export default class PGSMainThraedRenderer<T extends HTMLCanvasElement | OffscreenCanvas> extends PGSRenderer<T> {

  public render(pgs: Readonly<AcquisitionPoint>): void {
    if (this.canvas == null) { return; }

    // Omit False Positive ImageBitmapRenderingContext type
    const context = this.getContext2D();
    if (!context) { return; }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const source = decode(pgs);
    if (!source) { return; }

    renderByOption(source, this.canvas, this.option);
    source.width = source.height = 0;
  }
}
