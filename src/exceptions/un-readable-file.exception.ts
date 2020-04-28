export class UnReadableFileException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = UnReadableFileException.name;
  }
}
