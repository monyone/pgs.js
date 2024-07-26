import { AcquisitionPoint } from "../../pgs/type";

export type PGSFeederOption = {
  preload: boolean
  timeshift: number
}

export default interface PGSFeeder {
  content(time: number): AcquisitionPoint | null;
  onseek(): void;
}
