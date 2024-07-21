export default (y: number, cb: number, cr: number): [number, number, number] => {
  const r = y + 0.000 * (cb - 128) + 1.371 * (cr - 128);
  const g = y - 0.336 * (cb - 128) - 0.698 * (cr - 128);
  const b = y + 1.732 * (cb - 128) + 0.000 * (cr - 128);
  return [r, g, b];
}
