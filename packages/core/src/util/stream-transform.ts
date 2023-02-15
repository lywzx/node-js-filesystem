import { ReadStream, WriteStream } from 'fs';

/**
 * 通过写入流创建一个读取流
 * @param readStream
 */
export function createReadStreamFromWriteStream(readStream: ReadStream): WriteStream {
  return new WriteStream();
}
