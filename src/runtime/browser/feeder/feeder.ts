import { AcquisitionPointForRender } from "../render";

export type PGSFeederOption = {
  preload: boolean
  timeshift: number
}

export default interface PGSFeeder {
  content(time: number): AcquisitionPointForRender | null;
  onseek(): void;
}
