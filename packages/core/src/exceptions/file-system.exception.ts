/**
 * 文件系统
 */
export class FileSystemException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, FileSystemException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = FileSystemException.name;
  }
}
