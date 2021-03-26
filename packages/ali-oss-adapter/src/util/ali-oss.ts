import { HeadObjectResult } from 'ali-oss';
import get from 'lodash/get';

/**
 * get file size from header
 * @param result
 */
export function getFileSizeFromRes(result: HeadObjectResult): number {
  const size = parseInt(get(result, 'res.headers.content-length', 0), 10);
  return isNaN(size) ? 0 : size;
}

/**
 * get file mime type
 * @param result
 */
export function getFileMimeTypeFromRes(result: HeadObjectResult): string {
  return get(result, 'res.headers.content-type');
}

/**
 * get file last modified date
 * @param result
 */
export function getFileLastModifiedFromRes(result: HeadObjectResult) {
  return Date.parse(get(result, 'res.headers.last-modified'));
}
