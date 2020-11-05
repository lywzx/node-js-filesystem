/**
 * not support info
 */
import { bindErrorConstructor } from '../util/exception.util';

export class NotSupportedException extends Error {
  constructor(public message: string) {
    super(message);
    bindErrorConstructor(this, NotSupportedException);
  }

  /**
   * 针对软链接不支持的异常信息
   * @param pathName
   */
  static forLink(pathName: string) {
    return new NotSupportedException(`Links are not supported, encountered link at ${pathName}`);
  }
}
