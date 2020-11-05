import { bindErrorConstructor } from '../util/exception.util';

export class RootViolationException extends Error {
  constructor(message?: string) {
    super(message);
    bindErrorConstructor(this, RootViolationException);
  }
}
