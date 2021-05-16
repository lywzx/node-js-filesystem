import { bindErrorConstructor } from '../util/exception.util';
import { FilesystemException } from './filesystem.exception';

export class InvalidArgumentException extends FilesystemException {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, InvalidArgumentException);
  }
}
