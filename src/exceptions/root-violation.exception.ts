export class RootViolationException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = RootViolationException.name;
  }
}
