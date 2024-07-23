import { AcquisitionPoint } from "../../pgs/type";

export default interface PGSRenderer {
  attach(canvas: HTMLCanvasElement): void;
  detach(): void;
  render(pgs: Readonly<AcquisitionPoint>, canvas: HTMLCanvasElement): void;
}
