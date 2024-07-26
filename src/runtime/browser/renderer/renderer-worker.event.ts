import { AcquisitionPoint } from "../../../pgs/type"

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
  bitmap: ImageBitmap | null
}
export const FromWorkerToMainEventRendered = {
  from (bitmap?: ImageBitmap | null): FromWorkerToMainEventRendered {
    return {
      type: 'rendered',
      bitmap: bitmap ?? null
    };
  }
}

export type FromWorkerToMainEvent = FromWorkerToMainEventRendered;
