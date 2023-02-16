import { ReadStream, WriteStream } from 'fs';

/**
 * 通过写入流创建一个读取流
 */
export function createReadStreamFromWriteStream(): { from: WriteStream; to: ReadStream } {
  const readStream = new ReadStream();
  const writeStream = new WriteStream();

  return {
    from: writeStream,
    to: readStream,
  };
}
