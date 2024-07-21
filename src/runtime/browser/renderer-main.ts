import { AcquisitionPoint } from "../../pgs/type";

import PGSRenderer from "./renderer";
import decode from "./decoder";

export default class PGSMainThraedRenderer implements PGSRenderer {
  public render(pgs: Readonly<AcquisitionPoint>, canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d');
    if (!context) { return; }
    context.clearRect(0, 0, canvas.width, canvas.height);

    const source = decode(pgs);
    if (!source) { return; }

    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    source.width = source.height = 0;
  }
}

