import PGSFeeder from "../common/feeder";
import { PGSControllerOption } from "./controller-option";
import PGSRenderer from "./renderer";
import { PGSRenderOption } from "./renderer-option";
import { selectRendererByOption } from "./renderer-utils";

export default class PGSController {
  // Option
  private option: PGSControllerOption;
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Timeupdate Handler
  private readonly onTimeupdateHandler = this.onTimeupdate.bind(this);
  private timer: number | null = null;
  // Seeking Handler
  private readonly onSeekingHandler = this.onSeeking.bind(this);
  private readonly onSeekedHandler = this.onSeeked.bind(this);
  // Renderer
  private viewerResRenderer: PGSRenderer<HTMLCanvasElement> | null = null;
  private videoResRenderer: PGSRenderer<HTMLCanvasElement> | null = null;
  private priviousPts: number | null = null;
  // Feeder
  private feeder: PGSFeeder | null = null;
  // Control
  private isShowing: boolean = true;

  public constructor(option?: Partial<PGSControllerOption>) {
    this.option = {
      ... option,
      renderOption: PGSRenderOption.from(option?.renderOption)
    }
  }

  public attachMedia(media: HTMLVideoElement, container?: HTMLElement): void {
    this.media = media;
    this.container = container ?? media.parentElement!;
    this.setup();
  }

  public detachMedia(): void {
    this.cleanup()
    this.media = this.container = null
  }

  private setup() {
    if (!this.media || !this.container) { return; }

    // setup media handler
    this.media.addEventListener('seeking', this.onSeekingHandler);
    this.media.addEventListener('seeked', this.onSeekedHandler);

    // prepare viewer canvas for absolute plane
    const viewerResCanvas = document.createElement('canvas');
    viewerResCanvas.style.position = 'absolute';
    viewerResCanvas.style.top = viewerResCanvas.style.left = '0';
    viewerResCanvas.style.pointerEvents = 'none';
    viewerResCanvas.style.width = '100%';
    viewerResCanvas.style.height = '100%';

    // prepare video plane
    const videoResCanvas = document.createElement('canvas');

    // prepare Renderer
    this.viewerResRenderer = selectRendererByOption(this.option.renderOption);
    this.viewerResRenderer.attach(viewerResCanvas);
    this.videoResRenderer = selectRendererByOption(this.option.renderOption);
    this.videoResRenderer.attach(videoResCanvas);

    // setup
    this.viewerResRenderer.register(this.container);

    // prepare Event Loop
    this.onTimeupdate();
  }

  private cleanup() {
    // cleanup media seeking handler
    if (this.media) {
      this.media.removeEventListener('seeking', this.onSeekingHandler);
      this.media.removeEventListener('seeked', this.onSeekedHandler);
    }

    // cleanup viewer canvas
    this.viewerResRenderer?.destroy();

    // clean up video canvas
    this.videoResRenderer?.destroy();
  }

  private clear() {
    // clearRect for viewer
    this.viewerResRenderer?.clear();
    // clearRect for video
    this.videoResRenderer?.clear();
    // clear privious information
    this.priviousPts = null;
  }

  public attachFeeder(feeder: PGSFeeder) {
    this.feeder = feeder;
  }

  public detachFeeder() {
    this.feeder = null;
  }


  private onSeeking() {
    this.feeder?.onseek();
    this.clear();
  }

  private onSeeked() {
    this.clear();
  }

  private onTimeupdate() {
    // not showing, do not show
    if (!this.isShowing) { return; }
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);

    // precondition
    if (this.media == null || this.feeder == null) { return; }

    const currentTime = this.media.currentTime;
    const content = this.feeder.content(currentTime) ?? null;
    if (content == null) { return; }

    // If already rendered, ignore it
    if (this.priviousPts === content.pts) { return ; }

    this.viewerResRenderer?.render(content);
    this.videoResRenderer?.render(content);

    // Update privious information
    this.priviousPts = content.pts;
  }


  public show(): void {
    this.isShowing = true;
    if (this.timer == null) {
      this.timer = requestAnimationFrame(this.onTimeupdateHandler);
    }
    this.onTimeupdate();
  }

  public hide(): void {
    this.isShowing = false;
    if (this.timer != null) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
    this.clear();
  }

  public showing(): boolean {
    return this.isShowing;
  }

  public snapshot(): HTMLCanvasElement | null {
    return this.videoResRenderer?.snapshot() ?? null;
  }
}
