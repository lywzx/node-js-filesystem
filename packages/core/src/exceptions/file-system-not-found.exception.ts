import { bindErrorConstructor } from '../util/exception.util';
import { Exception } from './exception';

export class FileSystemNotFoundException extends Exception {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, FileSystemNotFoundException);
  }
}
