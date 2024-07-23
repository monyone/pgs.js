import { AcquisitionPoint } from "../../pgs/type";

import PGSRenderer from "./renderer";
import decode from "./decoder";

export default class PGSMainThraedRenderer implements PGSRenderer {
  private canvas: HTMLCanvasElement | null = null;

  public attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
  }

  public detach(): void {
    this.canvas = null;
  }

  public render(pgs: Readonly<AcquisitionPoint>): void {
    if (this.canvas == null) { return; }

    const context = this.canvas.getContext('2d');
    if (!context) { return; }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const source = decode(pgs);
    if (!source) { return; }

    context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);

    source.width = source.height = 0;
  }
}
