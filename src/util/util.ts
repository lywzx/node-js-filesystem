import { ReadStream, Stats } from 'fs';
import { fromFile, fromBuffer } from 'file-type';
import { getType as getMimeType } from 'mime';
import { extname } from 'path';
import { Stream } from 'stream';
import { FileType } from '../interfaces';

/**
 * read file type
 * @param stats
 */
export function getType(stats: Stats): FileType {
  if (stats.isSymbolicLink()) {
    return 'link';
  } else if (stats.isDirectory()) {
    return 'dir';
  } else {
    return 'file';
  }
}

/**
 * get file mimetype
 * @param path
 * @param content
 */
export async function guessMimeType(path: string, content?: Buffer): Promise<string | undefined> {
  if (content) {
    const mimetype = await fromBuffer(content);
    if (mimetype) {
      return mimetype.mime;
    }
  }

  const mimetype = await fromFile(path);
  if (mimetype) {
    return mimetype.mime;
  }
  const ext = extname(path);

  if (ext) {
    const mime = getMimeType(ext);
    if (mime) {
      return mime;
    }
  }
  return;
}

/**
 *
 * @param stats
 * @param {number} mask 1、execute; 4、read; 2、write
 */
export function fileHasPermission(stats: Stats, mask: number): boolean {
  return !!(mask & parseInt((stats.mode & 0o1777).toString(8)[0], 10));
}

/**
 * Normalize relative directories in a path.
 *
 * @param {string} path
 *
 * @throws LogicException
 *
 * @return string
 */
export function normalizeRelativePath(path: string): string {
  return '';
}

/**
 * js check variable is stream
 * @param stream
 */
export function isReadableStream(stream: ReadStream) {
  return (
    stream instanceof Stream &&
    typeof ((stream as any)._read === 'function') &&
    typeof ((stream as any)._readableState === 'object')
  );
}
