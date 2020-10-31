export class UnReadableFileException extends Error {
  constructor(public path: string) {
    super(`Unreadable file encountered: ${path}`);
    Object.setPrototypeOf(this, UnReadableFileException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = UnReadableFileException.name;
  }
}
