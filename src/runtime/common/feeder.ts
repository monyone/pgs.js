import { AcquisitionPoint } from "../../pgs/type";

export default interface PGSFeeder {
  content(time: number): AcquisitionPoint | null;
}
