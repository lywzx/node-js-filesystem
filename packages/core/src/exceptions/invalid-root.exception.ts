export class InvalidRootException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidRootException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = InvalidRootException.name;
  }
}
