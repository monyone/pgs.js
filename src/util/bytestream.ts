import EOFError from "./eof";

export default class ByteStream {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  public isEmpty() {
    return this.offset === this.view.byteLength;
  }

  public read(length: number) {
    if (this.offset + length > this.view.byteLength) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  public readU8() {
    if (this.offset + 1 > this.view.byteLength) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint8(this.offset);
    this.offset += 1;
    return result;
  }

  public readU16() {
    if (this.offset + 2 > this.view.byteLength) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return result;
  }

  public readU24() {
    if (this.offset + 3 > this.view.byteLength) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false) * (2 ** 8) + this.view.getUint8(this.offset + 2);
    this.offset += 3;
    return result;
  }

  public readU32() {
    if (this.offset + 4 > this.view.byteLength) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return result;
  }

  public readAll() {
    const result = this.view.buffer.slice(this.offset, this.view.byteLength);
    this.offset = this.view.byteLength;
    return result;
  }
}
