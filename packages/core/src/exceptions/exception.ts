import { FileSystemException } from './file-system.exception';

export class Exception extends Error implements FileSystemException {
  constructor(message?: string) {
    super(message);
    this.name = Exception.name;
  }
}
