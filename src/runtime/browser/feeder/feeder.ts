import { AcquisitionPointForRender } from "../render";

export type PGSFeederOptionPreloadType = 'none' | 'decode' | 'render';

export type PGSFeederOption = {
  preload: PGSFeederOptionPreloadType
  timeshift: number
}

export default interface PGSFeeder {
  content(time: number): AcquisitionPointForRender | null;
  onattach(): void;
  ondetach(): void;
  onseek(): void;
}
