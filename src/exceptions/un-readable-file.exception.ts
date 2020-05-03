export class UnReadableFileException extends Error {
  constructor(public path: string) {
    super(`Unreadable file encountered: ${path}`);
    this.name = UnReadableFileException.name;
  }
}
