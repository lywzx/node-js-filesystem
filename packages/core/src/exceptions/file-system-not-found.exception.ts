export class FileSystemNotFoundException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, FileSystemNotFoundException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = FileSystemNotFoundException.name;
  }
}
