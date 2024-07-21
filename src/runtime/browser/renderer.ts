import { AcquisitionPoint } from "../../pgs/type";

export default interface PGSRenderer {
  render(pgs: Readonly<AcquisitionPoint>, canvas: HTMLCanvasElement): void;
}
