import concat from "./concat";
import EOFError from "./eof";

export class ByteStream {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  public exists(length: number): boolean {
    return this.offset + length <= this.view.byteLength;
  }

  public isEmpty(): boolean {
    return this.offset === this.view.byteLength;
  }

  public read(length: number): ArrayBuffer {
    if (!this.exists(length)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  public readU8(): number {
    if (!this.exists(1)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint8(this.offset);
    this.offset += 1;
    return result;
  }

  public readU16(): number {
    if (!this.exists(2)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return result;
  }

  public readU24(): number {
    if (!this.exists(3)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false) * (2 ** 8) + this.view.getUint8(this.offset + 2);
    this.offset += 3;
    return result;
  }

  public readU32(): number {
    if (!this.exists(4)) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return result;
  }

  public readAll(): ArrayBuffer {
    const result = this.view.buffer.slice(this.offset, this.view.byteLength);
    this.offset = this.view.byteLength;
    return result;
  }
}

export class AsyncByteStream {
  private reader: ReadableStreamDefaultReader<ArrayBufferView | ArrayBuffer>;
  private done: boolean = false;
  private buffer: ArrayBuffer = new ArrayBuffer(0);
  private view: DataView = new DataView(this.buffer);
  private offset: number = 0;

  constructor(stream: ReadableStream<ArrayBufferView | ArrayBuffer>) {
    this.reader = stream.getReader();
  }

  private async pump(length: number): Promise<boolean> {
    if ((this.buffer.byteLength - this.offset) >= length) { return true; }
    if (this.done) { return false; }

    const { value, done } = await this.reader.read();
    if (done) {
      this.done = done;
      return (this.buffer.byteLength - this.offset) >= length;
    }

    this.buffer = concat(this.buffer.slice(this.offset), (value instanceof ArrayBuffer) ? value : value.buffer);
    this.view = new DataView(this.buffer);
    this.offset = 0;
    if ((this.buffer.byteLength - this.offset) >= length) { return true; }
    return this.pump(length);
  }

  public async exists(length: number): Promise<boolean> {
    return (await this.pump(length));
  }

  public async read(length: number): Promise<ArrayBuffer> {
    if (!(await this.exists(length))) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  public async readU8(): Promise<number> {
    if (!(await this.exists(1))) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint8(this.offset);
    this.offset += 1;
    return result;
  }

  public async readU16(): Promise<number> {
    if (!(await this.exists(2))) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return result;
  }

  public async readU24(): Promise<number> {
    if (!(await this.exists(3))) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint16(this.offset, false) * (2 ** 8) + this.view.getUint8(this.offset + 2);
    this.offset += 3;
    return result;
  }

  public async readU32(): Promise<number> {
    if (!(await this.exists(4))) {
      throw new EOFError('Detected EOF!');
    }

    const result = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return result;
  }
}
