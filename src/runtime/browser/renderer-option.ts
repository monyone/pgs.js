export type RenderOption = {
  objectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

export const RenderOption = {
  from (option?: Partial<RenderOption>): RenderOption {
    return {
      objectFit: 'fill',
      ... option,
    };
  }
}
