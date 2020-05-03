export class FileNotFoundException extends Error {
  constructor(path: string) {
    super(`File not found at path: ${path}`);
    this.name = FileNotFoundException.name;
  }
}
