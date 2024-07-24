export type PGSRenderOption = {
  objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

export const PGSRenderOption = {
  from (option?: Partial<PGSRenderOption>): PGSRenderOption {
    return {
      objectFit: 'contain',
      ... option,
    };
  }
}
