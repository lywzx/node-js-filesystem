import { Readable, Writable } from 'stream';

/**
 * 通过写入流创建一个读取流
 */
export function createReadStreamFromWriteStream(): { from: Writable; to: Readable } {
  const readStream = new Readable({
    highWaterMark: undefined,
    encoding: undefined,
    objectMode: undefined,
    read(this: Readable, size: number) {},
    destroy(this: Readable, error: Error | null, callback: (error: Error | null) => void) {},
    autoDestroy: true,
  });
  const writeStream = new Writable({
    highWaterMark: undefined,
    decodeStrings: undefined,
    defaultEncoding: undefined,
    objectMode: undefined,
    emitClose: undefined,
    write(this: Writable, chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      readStream.push(chunk);
    },
    writev(
      this: Writable,
      chunks: Array<{ chunk: any; encoding: BufferEncoding }>,
      callback: (error?: Error | null) => void
    ) {
      try {
        chunks.forEach((chunk) => {
          readStream.push(chunk.chunk);
        });
      } catch (e) {
        callback(e);
      }
    },
    destroy(this: Writable, error: Error | null, callback: (error: Error | null) => void) {
      readStream.destroy(error!);
    },
    final(this: Writable, callback: (error?: Error | null) => void) {
      readStream.destroy();
    },
    autoDestroy: undefined,
  });

  return {
    from: writeStream,
    to: readStream,
  };
}
