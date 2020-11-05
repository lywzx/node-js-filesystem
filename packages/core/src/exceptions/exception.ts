import { FileSystemException } from './file-system.exception';
import { bindErrorConstructor } from '../util/exception.util';

/**
 * 出处错误
 */
export class Exception extends FileSystemException {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, Exception);
  }
}
