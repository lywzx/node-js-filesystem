export class InvalidArgumentException extends Error {
  constructor(message: string) {
    super(message);
    this.name = InvalidArgumentException.name;
  }
}
