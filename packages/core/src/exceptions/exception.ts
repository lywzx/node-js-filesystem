import { FilesystemException } from './filesystem.exception';
import { bindErrorConstructor } from '../util/exception.util';

/**
 * 出处错误
 */
export class Exception extends FilesystemException {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, Exception);
  }
}
