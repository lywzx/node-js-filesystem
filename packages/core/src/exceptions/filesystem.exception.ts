import { bindErrorConstructor } from '../util/exception.util';

/**
 * 文件系统
 */
export class FilesystemException extends Error {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, FilesystemException);
  }
}
