import PGSFeeder from "../common/feeder";
import PGSRenderer from "./renderer";
import PGSMainThraedRenderer from "./renderer-main";

export default class PGSController {
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Canvas
  private viewerResCanvas: HTMLCanvasElement | null = null;
  private videoResCanvas: HTMLCanvasElement | null = null;
  // Resize Handler
  private resizeObserver: ResizeObserver | null = null;
  // Timeupdate Handler
  private readonly onTimeupdateHandler = this.onTimeupdate.bind(this);
  private timer: number | null = null;
  // Seeking Handler
  private readonly onSeekingHandler = this.onSeeking.bind(this);
  private readonly onSeekedHandler = this.onSeeked.bind(this);
  // Renderer
  private viewerResRenderer: PGSRenderer | null = null;
  private videoResRenderer: PGSRenderer | null = null;
  private priviousPts: number | null = null;
  // Feeder
  private feeder: PGSFeeder | null = null;
  // Control
  private showing: boolean = true;

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
    this.viewerResCanvas = document.createElement('canvas')
    this.viewerResCanvas.style.position = 'absolute'
    this.viewerResCanvas.style.top = this.viewerResCanvas.style.left = '0'
    this.viewerResCanvas.style.pointerEvents = 'none'
    this.viewerResCanvas.style.width = '100%'
    this.viewerResCanvas.style.height = '100%'

    // prepare video plane
    this.videoResCanvas = document.createElement('canvas')

    // setup canvas
    this.container.appendChild(this.viewerResCanvas);

    // prepare Renderer
    this.viewerResRenderer = new PGSMainThraedRenderer();
    this.viewerResRenderer.attach(this.viewerResCanvas);
    this.videoResRenderer = new PGSMainThraedRenderer();
    this.videoResRenderer.attach(this.videoResCanvas);

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
    if (this.container && this.viewerResCanvas) {
      this.container.removeChild(this.viewerResCanvas);
    }

    // cleanup viewer canvas
    if (this.viewerResCanvas) {
      this.viewerResCanvas.width = this.viewerResCanvas.height = 0
      this.viewerResCanvas = null;
    }
    // cleanup video canvas
    if (this.videoResCanvas) {
      this.videoResCanvas.width = this.videoResCanvas.height = 0;
      this.videoResCanvas = null;
    }
  }

  private clear() {
    // clearRect for viewer canvas
    if (this.viewerResCanvas) {
      const viewContext = this.viewerResCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.viewerResCanvas.width, this.viewerResCanvas.height);
      }
    }
    // clearRect for video canvas
    if (this.videoResCanvas) {
      const viewContext = this.videoResCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.videoResCanvas.width, this.videoResCanvas.height);
      }
    }
  }

  public attachFeeder(feeder: PGSFeeder) {
    this.feeder = feeder;
  }

  public detachFeeder() {
    this.feeder = null;
  }


  private onResize() {
    if (!this.media) { return; }

    // for Canvas Resize
    const style = window.getComputedStyle(this.media);
    const media_width = Number.parseInt(style.width, 10);
    const media_height = Number.parseInt(style.height, 10);
    if (this.viewerResCanvas) {
      this.viewerResCanvas.width = Math.round(media_width)
      this.viewerResCanvas.height = Math.round(media_height)
    }
    if (this.videoResCanvas) {
      this.videoResCanvas.width = this.media.videoWidth;
      this.videoResCanvas.height = this.media.videoHeight;
    }

    // render
    this.onTimeupdate();
  }

  private onSeeking() {
    this.priviousPts = null;
    this.feeder?.onseek();
    this.clear();
  }

  private onSeeked() {
    this.priviousPts = null;
  }

  private onTimeupdate() {
    // not showing, do not show
    if (!this.showing) { return; }
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);

    // precondition
    if (!this.media) { return; }
    if (!this.feeder) { return;}

    const currentTime = this.media.currentTime;
    const content = this.feeder.content(currentTime) ?? null;
    if (content == null) { return; }

    // If already rendered, ignore it
    if (this.priviousPts === content.pts) {
      return;
    }

    if (this.viewerResCanvas && this.viewerResRenderer) {
      this.viewerResRenderer.render(content, this.viewerResCanvas);
    }

    if (this.videoResCanvas && this.videoResRenderer) {
      this.videoResRenderer.render(content, this.videoResCanvas);
    }

    this.priviousPts = content.pts;
  }


  public show(): void {
    this.showing = true;
    if (this.timer == null) {
      this.timer = requestAnimationFrame(this.onTimeupdateHandler);
    }
    this.onResize();
  }

  public hide(): void {
    this.showing = false;
    if (this.timer != null) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
    this.priviousPts = null;
    this.clear();
  }

  public get mode(): boolean {
    return this.showing;
  }

  public get snapshot(): HTMLCanvasElement | null {
    return this.videoResCanvas;
  }
}
