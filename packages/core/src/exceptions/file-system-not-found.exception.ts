export class FileSystemNotFoundException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = FileSystemNotFoundException.name;
  }
}
