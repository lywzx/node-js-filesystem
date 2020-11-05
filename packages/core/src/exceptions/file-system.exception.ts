import { bindErrorConstructor } from '../util/exception.util';

/**
 * 文件系统
 */
export class FileSystemException extends Error {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, FileSystemException);
  }
}
