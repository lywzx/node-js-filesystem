import { FileSystemException } from './file-system.exception';

/**
 * 出处错误
 */
export class Exception extends Error implements FileSystemException {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, Exception.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = Exception.name;
  }
}
