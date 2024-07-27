import { AcquisitionPoint, DisplaySet, TimestampedSegment } from './pgs/type';

export { default as EOFError} from './util/eof';

export type * from './pgs/type'
export * from './pgs/type';

export type { default as PGSFeeder } from './runtime/browser/feeder//feeder';
export { default as PGSSupFeeder } from './runtime/browser/feeder/supfeeder';
export { default as PGSAsyncSupFeeder } from './runtime/browser/feeder/asyncsupfeeder';

export { default as PGSController } from './runtime/browser/controller/controller';
export type { default as PGSRenderer } from './runtime/browser/renderer/renderer';
export { default as PGSMainThreadRenderer } from './runtime/browser/renderer/renderer-main';

export const readSup = (buffer: ArrayBuffer, decode = false): AcquisitionPoint[] => {
  return Array.from(AcquisitionPoint.iterate(DisplaySet.aggregate(TimestampedSegment.iterateSupFormat(buffer)), decode));
}
