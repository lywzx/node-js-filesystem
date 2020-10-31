/**
 * 文件不存在
 */
export class FileExistsException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, FileExistsException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = FileExistsException.name;
  }
}
