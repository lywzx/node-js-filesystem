/**
 * ts error
 * @param that
 * @param exception
 */
export function bindErrorConstructor(that: Error, exception: Record<string, any>) {
  Object.setPrototypeOf(that, exception.prototype);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(that, that.constructor);
  }
  that.name = exception.name;
}
