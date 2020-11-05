import { bindErrorConstructor } from '../util/exception.util';

export class InvalidArgumentException extends Error {
  constructor(message: string) {
    super(message);
    bindErrorConstructor(this, InvalidArgumentException);
  }
}
