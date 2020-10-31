export class FileNotFoundException extends Error {
  constructor(path: string) {
    const message = `File not found at path: ${path}`;
    super(message);
    Object.setPrototypeOf(this, FileNotFoundException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = FileNotFoundException.name;
  }
}
