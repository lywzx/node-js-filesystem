export class InvalidRootException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = InvalidRootException.name;
  }
}
