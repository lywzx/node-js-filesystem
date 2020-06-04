export class FileSystemException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = FileSystemException.name;
  }
}
