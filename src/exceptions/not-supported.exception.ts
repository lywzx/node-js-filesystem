export class NotSupportedException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = NotSupportedException.name;
  }
}
