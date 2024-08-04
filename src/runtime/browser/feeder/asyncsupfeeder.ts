import { AcquisitionPoint, DisplaySet, TimestampedSegment } from '../../../pgs/type'
import { AcquisitionPointForRender, AcquisitionPointNotRendered, AcquisitionPointRenderedImageBitmap } from '../render';

import PGSFeeder, { PGSFeederOption } from './feeder';

export default class AsyncPGSSupFeeder implements PGSFeeder {
  private option: PGSFeederOption;
  private acquisitions: Readonly<AcquisitionPointForRender>[] = [];
  private donePromise: Promise<boolean>;

  public constructor(stream: ReadableStream<ArrayBufferView | ArrayBuffer>, option?: Partial<PGSFeederOption>) {
    this.option = {
      preload: 'none',
      timeshift: 0,
      ... option
    };

    this.donePromise = new Promise((resolve) => {
      this.prepare(stream, resolve);
    })
  }

  private async prepare(stream: ReadableStream<ArrayBufferView | ArrayBuffer>, resolve?: (result: boolean) => void) {
    const iterator = DisplaySet.aggregateAsync(TimestampedSegment.iterateSupFormatAsync(stream));
    switch (this.option.preload) {
      case 'none':
        for await (const acquisition of AcquisitionPointNotRendered.iterateAsync(AcquisitionPoint.iterateAsync(iterator, false))) {
          this.acquisitions.push(acquisition);
        }
        break;
      case 'decode':
        for await (const acquisition of AcquisitionPointNotRendered.iterateAsync(AcquisitionPoint.iterateAsync(iterator, true))) {
          this.acquisitions.push(acquisition);
        }
        break;
      case 'render':
        for await (const acquisition of AcquisitionPointRenderedImageBitmap.iterateAsync(AcquisitionPoint.iterateAsync(iterator, true))) {
          this.acquisitions.push(acquisition);
        }
        break;
      default: {
        const exhaustive: never = this.option.preload;
        throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
    resolve?.(true);
  }

  public get done(): Promise<boolean> {
    return this.donePromise;
  }

  public content(time: number): Readonly<AcquisitionPointForRender> | null {
    time -= this.option.timeshift;

    {
      const first = this.acquisitions[0];
      if (!first) { return null; }
      const pts = first.pts / first.timescale;
      if (time < pts) { return null; }
    }

    let begin = 0, end = this.acquisitions.length;
    while (begin + 1 < end) {
      const middle = Math.floor((begin + end) / 2);
      const middle_obj = this.acquisitions[middle];
      const middle_pts = middle_obj.pts / middle_obj.timescale;

      if (middle_pts <= time) {
        begin = middle;
      } else {
        end = middle;
      }
    }

    return this.acquisitions[begin] ?? null;
  }

  public onattach(): void {}
  public ondetach(): void {}
  public onseek(): void {}
}
