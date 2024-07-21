import PGSFeeder from "../common/feeder";
import PGSRenderer from "./renderer";

export default class PGSController {
  // Video
  private media: HTMLVideoElement | null = null;
  private container: HTMLElement | null = null;
  // Canvas
  private viewerCanvas: HTMLCanvasElement | null = null;
  private videoCanvas: HTMLCanvasElement | null = null;
  // Resize Handler
  private resizeObserver: ResizeObserver | null = null;
  // Timeupdate Handler
  private readonly onTimeupdateHandler = this.onTimeupdate.bind(this);
  private timer: number | null = null;
  // Seeking Handler
  private readonly onSeekingHandler = this.onSeeking.bind(this);
  private readonly onSeekedHandler = this.onSeeked.bind(this);
  // Renderer
  private renderer: PGSRenderer | null = null;
  private privious_composition_number: number | null = null;
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

    // prepare Renderer
    this.renderer = new PGSRenderer();

    // prepare viewer canvas for absolute plane
    this.viewerCanvas = document.createElement('canvas')
    this.viewerCanvas.style.position = 'absolute'
    this.viewerCanvas.style.top = this.viewerCanvas.style.left = '0'
    this.viewerCanvas.style.pointerEvents = 'none'
    this.viewerCanvas.style.width = '100%'
    this.viewerCanvas.style.height = '100%'

    // prepare video plane
    this.videoCanvas = document.createElement('canvas')

    // setup canvas
    this.container.appendChild(this.viewerCanvas);

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
    if (this.container && this.viewerCanvas) {
      this.container.removeChild(this.viewerCanvas);
    }

    // cleanup viewer canvas
    if (this.viewerCanvas) {
      this.viewerCanvas.width = this.viewerCanvas.height = 0
      this.viewerCanvas = null;
    }
    // cleanup video canvas
    if (this.videoCanvas) {
      this.videoCanvas.width = this.videoCanvas.height = 0;
      this.videoCanvas = null;
    }
  }

  private clear() {
    // clearRect for viewer canvas
    if (this.viewerCanvas) {
      const viewContext = this.viewerCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.viewerCanvas.width, this.viewerCanvas.height);
      }
    }
    // clearRect for video canvas
    if (this.videoCanvas) {
      const viewContext = this.videoCanvas.getContext('2d')
      if (viewContext) {
        viewContext.clearRect(0, 0, this.videoCanvas.width, this.videoCanvas.height);
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
    if (this.viewerCanvas) {
      this.viewerCanvas.width = Math.round(media_width)
      this.viewerCanvas.height = Math.round(media_height)
    }
    if (this.videoCanvas) {
      this.videoCanvas.width = this.media.videoWidth;
      this.videoCanvas.height = this.media.videoHeight;
    }

    // render
    this.onTimeupdate();
  }

  private onSeeking() {
    this.privious_composition_number = null;
    this.clear();
  }

  private onSeeked() {
    this.privious_composition_number = null;
  }

  private onTimeupdate() {
    // not showing, do not show
    if (!this.showing) { return; }
    this.timer = requestAnimationFrame(this.onTimeupdateHandler);

    // precondition
    if (!this.media) { return; }
    if (!this.feeder || !this.renderer) { return;}

    const currentTime = this.media.currentTime;
    const content = this.feeder.content(currentTime) ?? null;
    if (content == null) { return; }

    // If already rendered, ignore it
    if (this.privious_composition_number === content.composition.compositionNumber) {
      return;
    }

    if (this.viewerCanvas) {
      this.renderer.render(content, this.viewerCanvas);
    }

    if (this.videoCanvas) {
      this.renderer.render(content, this.videoCanvas);
    }

    this.privious_composition_number = content.composition.compositionNumber;
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
    this.privious_composition_number = null;
    this.clear();
  }

  public get mode(): boolean {
    return this.showing;
  }

  public get snapshot(): HTMLCanvasElement | null {
    return this.videoCanvas;
  }
}
