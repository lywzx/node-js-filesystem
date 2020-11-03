/**
 * not support info
 */
export class NotSupportedException extends Error {
  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, NotSupportedException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = NotSupportedException.name;
  }

  /**
   * 针对软链接不支持的异常信息
   * @param pathName
   */
  static forLink(pathName: string) {
    return new NotSupportedException(`Links are not supported, encountered link at ${pathName}`);
  }
}
