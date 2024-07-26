export type PGSRenderOption = {
  objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  preferHTMLCanvasElement: boolean;
  webWorker: boolean,
}

export const PGSRenderOption = {
  from (option?: Partial<PGSRenderOption>): PGSRenderOption {
    return {
      objectFit: 'fill',
      preferHTMLCanvasElement: false,
      webWorker: false,
      ... option,
    };
  }
}
