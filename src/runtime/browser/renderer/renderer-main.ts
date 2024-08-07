import PGSRenderer from "./renderer";
import { AcquisitionPointForRender, AcquisitionPointRenderedCanvas, preferHTMLCanvasElement, preferOffscreenCanvas } from "../render";
import { PGSRenderOption } from "./renderer-option";

export default class PGSMainThraedRenderer<T extends HTMLCanvasElement | OffscreenCanvas> extends PGSRenderer<T> {
  public constructor(option?: Partial<PGSRenderOption>) {
    super(option);
  }

  private draw(source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas) {
    if (this.canvas == null) { return; }
    const context = this.getContext2D();
    if (!context) { return; }

    if (this.canvas.width !== source.width || this.canvas.height !== source.width) {
      this.canvas.width = source.width;
      this.canvas.height = source.height;
    }
    this.clear();
    context.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);
  }

  public render(acquisition: Readonly<AcquisitionPointForRender>): void {
    switch (acquisition.type) {
      case 'none': {
        const rendered = AcquisitionPointRenderedCanvas.from(acquisition, this.option.preferHTMLCanvasElement ? preferHTMLCanvasElement : preferOffscreenCanvas);
        if (rendered) {
          this.draw(rendered.canvas);
          rendered.canvas.width = rendered.canvas.height = 0;
        }
        break;
      }
      case 'bitmap':
        this.draw(acquisition.bitmap);
        break;
      case 'canvas':
        this.draw(acquisition.canvas);
        break;
      default: {
        const exhaustive: never = acquisition;
        throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
  }
}
