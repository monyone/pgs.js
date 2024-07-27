export type PGSRenderOption = {
  preferHTMLCanvasElement: boolean;
  webWorker: boolean,
}

export const PGSRenderOption = {
  from (option?: Partial<PGSRenderOption>): PGSRenderOption {
    return {
      preferHTMLCanvasElement: false,
      webWorker: false,
      ... option,
    };
  }
}
