export type PGSRenderOption = {
  objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  webWorker: boolean,
}

export const PGSRenderOption = {
  from (option?: Partial<PGSRenderOption>): PGSRenderOption {
    return {
      objectFit: 'fill',
      webWorker: false,
      ... option,
    };
  }
}
