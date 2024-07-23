import { AcquisitionPoint } from "../../pgs/type";

export default abstract class PGSRenderer<T extends HTMLCanvasElement | OffscreenCanvas> {
  protected canvas: T | null = null;

  public attach(canvas: T): void {
    this.canvas = canvas;
  }

  public snapshot(): T | null {
    return this.canvas;
  }

  public register(element: HTMLElement): void {
    if (this.canvas == null) { return; }
    if (!(this.canvas instanceof HTMLCanvasElement)) { return; }

    element.appendChild(this.canvas);
  }

  public unregister(): void {
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

  protected getContext2D(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
    if (this.canvas == null) { return null; }

    // Omit False Positive ImageBitmapRenderingContext type
    return this.canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  }

  public clear(): void {
    if (this.canvas == null) { return; }

    const context = this.getContext2D();
    if (!context) { return; }

    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public abstract render(pgs: Readonly<AcquisitionPoint>): void;

  public destroy(): void {
    this.unregister();
    this.resize(0, 0);
    this.detach();
  }
}
