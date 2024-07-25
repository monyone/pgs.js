import { AcquisitionPoint } from "../../pgs/common/type";

export default interface PGSFeeder {
  content(time: number): AcquisitionPoint | null;
  onseek(): void;
}
