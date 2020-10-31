export class RootViolationException extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, RootViolationException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = RootViolationException.name;
  }
}
