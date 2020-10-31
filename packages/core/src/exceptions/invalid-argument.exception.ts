export class InvalidArgumentException extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidArgumentException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = InvalidArgumentException.name;
  }
}
