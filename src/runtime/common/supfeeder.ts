import { AcquisitionPoint } from '../../pgs/type'
import readFromSup from '../../pgs/sup';
import collectDisplaySet from '../../pgs/displayset';
import convertAcquisitionPoint from '../../pgs/acquisitionpoint';

import PGSFeeder from './feeder';

export type PGSFeederOption = {
  preload: boolean
  timeshift: number
}

export default class PGSSupFeeder implements PGSFeeder {
  private option: PGSFeederOption;
  private acquisitions: Readonly<AcquisitionPoint>[];

  public constructor(sup: ArrayBuffer, option?: Partial<PGSFeederOption>) {
    this.option = {
      preload: false,
      timeshift: 0,
      ... option
    };

    const segments = readFromSup(sup);
    const displays = collectDisplaySet(segments);
    const acquisitions = convertAcquisitionPoint(displays, this.option.preload);

    this.acquisitions = acquisitions;
  }

  public content(time: number): Readonly<AcquisitionPoint> | null {
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

  public all(): Readonly<AcquisitionPoint>[] {
    return this.acquisitions;
  }
}
