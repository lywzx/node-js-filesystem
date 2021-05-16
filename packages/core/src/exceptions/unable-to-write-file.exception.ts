import { FilesystemOperationFailedException } from './filesystem-operation-failed.exception';
import { bindErrorConstructor } from '../util/exception.util';

export class UnableToWriteFileException extends FilesystemOperationFailedException {
  constructor(message: string) {
    super(message);
    bindErrorConstructor(this, UnableToWriteFileException);
  }
  /**
   * @var string
   */
  private _location = '';

  /**
   * @var string
   */
  private _reason = '';

  public static atLocation(location: string, reason = '', previous?: Error): UnableToWriteFileException {
    const e = new UnableToWriteFileException(`Unable to write file at location: ${location}. ${reason}`.trimEnd());
    e._location = location;
    e._reason = reason;

    return e;
  }

  public operation(): string {
    return FilesystemOperationFailedException.OPERATION_WRITE;
  }

  public reason(): string {
    return this._reason;
  }

  public location(): string {
    return this._location;
  }
}
