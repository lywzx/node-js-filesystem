import { bindErrorConstructor } from '../util/exception.util';
import { Exception } from './exception';

export class FileNotFoundException extends Exception {
  constructor(path: string) {
    const message = `File not found at path: ${path}`;
    super(message);
    bindErrorConstructor(this, FileNotFoundException);
  }
}
