import { AcquisitionPoint } from "../../pgs/type"

export type FromMainToWorkerEventRender = {
  type: 'render';
  pgs: Readonly<AcquisitionPoint>;
}
export const FromMainToWorkerEventRender = {
  from (pgs: Readonly<AcquisitionPoint>): FromMainToWorkerEventRender {
    return {
      type: 'render',
      pgs
    };
  }
}

export type FromMainToWorkerEvent = FromMainToWorkerEventRender;

export type FromWorkerToMainEventRendered = {
  type: 'rendered';
  bitmap: ImageBitmap
}
export const FromWorkerToMainEventRendered = {
  from (bitmap: ImageBitmap): FromWorkerToMainEventRendered {
    return {
      type: 'rendered',
      bitmap
    };
  }
}

export type FromWorkerToMainEvent = FromWorkerToMainEventRendered;
