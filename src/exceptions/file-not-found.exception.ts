export class FileNotFoundException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = FileNotFoundException.name;
  }
}
