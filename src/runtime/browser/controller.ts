import PGSFeeder from "../common/feeder";
import PGSRenderer from "./renderer";
import PGSMainThraedRenderer from "./renderer-main";

export default class PGSController {
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Resize Handler
  private resizeObserver: ResizeObserver | null = null;
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

    // setup media seeking handler
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
    this.viewerResRenderer = new PGSMainThraedRenderer<HTMLCanvasElement>();
    this.viewerResRenderer.attach(viewerResCanvas);
    this.videoResRenderer = new PGSMainThraedRenderer<HTMLCanvasElement>();
    this.videoResRenderer.attach(videoResCanvas);

    // setup
    this.viewerResRenderer.register(this.container);

    // prepare ResizeObserver
    this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
    this.resizeObserver.observe(this.media);
    this.onResize();
  }

  private cleanup() {
    // cleanup media seeking handler
    if (this.media) {
      this.media.removeEventListener('seeking', this.onSeekingHandler);
      this.media.removeEventListener('seeked', this.onSeekedHandler);
    }

    // cleanup ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // remove canvas from container
    this.viewerResRenderer?.unregister();

    // cleanup viewer canvas
    this.viewerResRenderer?.resize(0, 0);
    this.viewerResRenderer?.detach();

    // cleanup video canvas
    this.videoResRenderer?.resize(0, 0);
    this.videoResRenderer?.detach();
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


  private onResize() {
    if (this.media == null) { return; }

    // for Resize
    const style = window.getComputedStyle(this.media);
    const width = Number.parseInt(style.width, 10);
    const height = Number.parseInt(style.height, 10);

    this.viewerResRenderer?.resize(Math.round(width), Math.round(height));
    this.videoResRenderer?.resize(this.media.videoWidth, this.media.videoHeight);

    // clear
    this.clear();

    // render
    this.onTimeupdate();
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
    this.onResize();
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
