import { bindErrorConstructor } from '../util/exception.util';
import { Exception } from './exception';

/**
 * 文件不存在
 */
export class FileExistsException extends Exception {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, FileExistsException);
  }
}
