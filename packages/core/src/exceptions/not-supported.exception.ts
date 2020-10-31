export class NotSupportedException extends Error {
  constructor(public path: string) {
    super(`Links are not supported, encountered link at ${path}`);
    Object.setPrototypeOf(this, NotSupportedException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = NotSupportedException.name;
  }
}
