import { AcquisitionPoint } from "../../pgs/type";

import PGSRenderer from "./renderer";
import decode from "./decoder";

export default class PGSMainThraedRenderer<T extends HTMLCanvasElement | OffscreenCanvas> implements PGSRenderer<T> {
  private canvas: T | null = null;

  public attach(canvas: T): void {
    this.canvas = canvas;
  }

  public snapshot(): T | null {
    return this.canvas;
  }

  public remove(): void {
    if (this.canvas == null) { return; }
    if (!(this.canvas instanceof HTMLCanvasElement)) { return; }

    this.canvas.remove();
  }

  public detach(): void {
    this.canvas = null;
  }

  public resize(width: number, height: number): void {
    if (this.canvas == null) { return; }

    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(pgs: Readonly<AcquisitionPoint>): void {
    if (this.canvas == null) { return; }

    // Omit False Positive ImageBitmapRenderingContext type
    const context = this.canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) { return; }
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const source = decode(pgs);
    if (!source) { return; }

    context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);

    source.width = source.height = 0;
  }

  public clear(): void {
    if (this.canvas == null) { return; }

    // Omit False Positive ImageBitmapRenderingContext type
    const context = this.canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!context) { return; }

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
