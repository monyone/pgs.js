import { AcquisitionPoint, DisplaySet, TimestampedSegment } from '../../../pgs/type'
import { AcquisitionPointForRender, AcquisitionPointNotRendered, AcquisitionPointRenderedImageBitmap } from '../render';

import PGSFeeder, { PGSFeederOption } from './feeder';

export default class PGSSupFeeder implements PGSFeeder {
  private option: PGSFeederOption;
  private acquisitions: Readonly<AcquisitionPointForRender>[];

  public constructor(sup: ArrayBuffer, option?: Partial<PGSFeederOption>) {
    this.option = {
      preload: 'none',
      timeshift: 0,
      ... option
    };

    const iterator = DisplaySet.aggregate(TimestampedSegment.iterateSupFormat(sup));
    switch (this.option.preload) {
      case 'none':
        this.acquisitions = Array.from(AcquisitionPointNotRendered.iterate(AcquisitionPoint.iterate(iterator, false)));
        break;
      case 'decode':
        this.acquisitions = Array.from(AcquisitionPointNotRendered.iterate(AcquisitionPoint.iterate(iterator, true)));
        break;
      case 'render':
        this.acquisitions = Array.from(AcquisitionPointRenderedImageBitmap.iterate(AcquisitionPoint.iterate(iterator, true)));
        break;
      default: {
        const exhaustive: never = this.option.preload;
        throw new Error(`Exhaustive check: ${exhaustive} reached!`);
      }
    }
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

  public onseek(): void {
    return; // No Effect
  }
}
