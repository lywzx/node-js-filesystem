import { Exception } from './exception';
import { bindErrorConstructor } from '../util/exception.util';

export class UnableToDeleteDirectoryException extends Exception {
  private location?: string;

  private reason?: string;

  private previous?: Error;

  constructor(message: string) {
    super(message);
    bindErrorConstructor(this, UnableToDeleteDirectoryException);
  }

  static atLocation(location: string, reason = '', previous?: Error): UnableToDeleteDirectoryException {
    const message = `Unable to delete directory located at: ${location}. ${reason}. ${previous?.message ?? ''}`;
    const e = new UnableToDeleteDirectoryException(message.trimEnd());
    e.location = location;
    e.reason = reason;
    e.previous = previous;
    return e;
  }
}
