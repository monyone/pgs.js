import { AcquisitionPoint, DisplaySet, TimestampedSegment } from './pgs/type';

export { default as EOFError} from './util/eof';

export type * from './pgs/type'
export * from './pgs/type';

export type { default as PGSFeeder } from './runtime/common/feeder';
export { default as PGSSupFeeder } from './runtime/common/supfeeder';
export { default as PGSAsyncSupFeeder } from './runtime/common/asyncsupfeeder';


export { default as PGSController } from './runtime/browser/controller/controller';
export type { default as PGSRenderer } from './runtime/browser/renderer/renderer';
export { default as PGSMainThreadRenderer } from './runtime/browser/renderer/renderer-main';

export const readSup = (buffer: ArrayBuffer, decode = false): AcquisitionPoint[] => {
  return Array.from(AcquisitionPoint.iterate(DisplaySet.aggregate(TimestampedSegment.iterateSupFormat(buffer)), decode));
}
