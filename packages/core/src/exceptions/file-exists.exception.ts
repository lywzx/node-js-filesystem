export class FileExistsException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = FileExistsException.name;
  }
}
