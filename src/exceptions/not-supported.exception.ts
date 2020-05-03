export class NotSupportedException extends Error {
  constructor(public path: string) {
    super(`Links are not supported, encountered link at ${path}`);
    this.name = NotSupportedException.name;
  }
}
