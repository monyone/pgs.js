import { AcquisitionPoint, DisplaySet, SegmentType, TimestampedSegment } from '../../../pgs/type'
import AVLTree from '../../../util/avl';
import { AcquisitionPointForRender, AcquisitionPointNotRendered, AcquisitionPointRenderedImageBitmap } from '../render';

import PGSFeeder, { PGSFeederOption } from './feeder';

type DecodingOrderedKey = {
  dts: number;
  order?: number;
}
const DecodingOrderMap = new Map<number, number>([
  [SegmentType.PCS, 0],
  [SegmentType.PDS, 1],
  [SegmentType.ODS, 2],
  [SegmentType.WDS, 3],
  [SegmentType.END, 4],
]);

const compare = (a: number, b: number) => {
  return Math.sign(a - b) as (-1 | 0 | 1);
}

const compareKey = (a: DecodingOrderedKey, b: DecodingOrderedKey) => {
  if (compare(a.dts, b.dts) !== 0) {
    return compare(a.dts, b.dts);
  } else {
    return compare(a.order ?? -1, b.order ?? -1);
  }
}

export default class PGSSupFeeder implements PGSFeeder {
  private option: PGSFeederOption;
  private priviousTime: number | null = null;
  private decode: AVLTree<DecodingOrderedKey, TimestampedSegment> = new AVLTree<DecodingOrderedKey, TimestampedSegment>(compareKey);
  private decodeBuffer: TimestampedSegment[] = [];
  private decodingPromise: Promise<void>;
  private decodingNotify: (() => void);
  private abortController: AbortController = new AbortController();
  private present: AVLTree<number, AcquisitionPointForRender> = new AVLTree<number, AcquisitionPointForRender>(compare);
  private isDestroyed: boolean = false;

  public constructor(option?: Partial<PGSFeederOption>) {
    this.option = {
      preload: 'none',
      timeshift: 0,
      ... option
    };

    this.decodingNotify = Promise.resolve; // Dummy
    this.decodingPromise = new Promise((resolve) => {
      this.decodingNotify = resolve;
    });
    this.pump();
  }

  private notify(segment: TimestampedSegment | null): void {
    if (segment != null) {
      this.decodeBuffer.push(segment);
    } else {
      this.abortController.abort();
      this.abortController = new AbortController();
    }

    this.decodingNotify?.();
  }

  private async *generator(signal: AbortSignal) {
    while (true) {
      await this.decodingPromise;
      this.decodingPromise = new Promise<void>((resolve) => {
        this.decodingNotify = resolve;
      });
      if (signal.aborted) {
        this.decodeBuffer = [];
        return;
      }

      const recieved = [... this.decodeBuffer];
      this.decodeBuffer = [];

      yield* recieved;
    }
  }

  private async pump() {
    while (!this.isDestroyed) {
      const iterator = DisplaySet.aggregateAsync(this.generator(this.abortController.signal));
      switch (this.option.preload) {
        case 'none':
          for await (const acquisition of AcquisitionPointNotRendered.iterateAsync(AcquisitionPoint.iterateAsync(iterator, false))) {
            this.present.insert(acquisition.pts / acquisition.timescale, acquisition);
          }
          break;
        case 'decode':
          for await (const acquisition of AcquisitionPointNotRendered.iterateAsync(AcquisitionPoint.iterateAsync(iterator, true))) {
            this.present.insert(acquisition.pts / acquisition.timescale, acquisition);
          }
          break;
        case 'render':
          for await (const acquisition of AcquisitionPointRenderedImageBitmap.iterateAsync(AcquisitionPoint.iterateAsync(iterator, true))) {
            this.present.insert(acquisition.pts / acquisition.timescale, acquisition);
          }
          break;
        default: {
          const exhaustive: never = this.option.preload;
          throw new Error(`Exhaustive check: ${exhaustive} reached!`);
        }
      }
    }
  }

  public feed(data: ArrayBuffer, pts: number, dts: number, timescale: number) {
    for (const segment of TimestampedSegment.iterateMpegTSFormat(data, pts, dts, timescale)) {
      this.decode.insert({ dts: segment.dts / segment.timescale, order: DecodingOrderMap.get(segment.type)! }, segment);
    }
  }

  public content(time: number): Readonly<AcquisitionPointForRender> | null {
    if (this.priviousTime != null) {
      for (const segment of this.decode.range({ dts: this.priviousTime }, { dts: time })) {
        this.notify(segment);
      }
    }
    this.priviousTime = time;

    time -= this.option.timeshift;
    return this.present.floor(time) ?? null;
  }

  private clear(): void {
    this.present.clear();
    this.priviousTime = null;
    this.notify(null);
  }

  public onattach(): void {
    this.clear();
  }

  public ondetach(): void {
    this.clear();
  }

  public onseek(): void {
    this.clear();
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clear();
  }
}
