import { AcquisitionPoint } from "../../pgs/type";

export default interface PGSRenderer<T extends HTMLCanvasElement | OffscreenCanvas> {
  attach(canvas: T): void;
  snapshot(): T | null;
  remove(): void;
  detach(): void;
  resize(width: number, height: number): void;
  render(pgs: Readonly<AcquisitionPoint>): void;
  clear(): void;
}
