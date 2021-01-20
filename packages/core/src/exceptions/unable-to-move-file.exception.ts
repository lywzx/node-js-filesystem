import { FilesystemOperationFailedException } from './filesystem-operation-failed.exception';
import { bindErrorConstructor } from '../util/exception.util';

export class UnableToMoveFileException extends FilesystemOperationFailedException {
  /**
   * @var string
   */
  private _source = '';

  /**
   * @var string
   */
  private _destination = '';

  constructor(message: string) {
    super(message);
    bindErrorConstructor(this, UnableToMoveFileException);
  }

  public source(): string {
    return this._source;
  }

  public destination(): string {
    return this._destination;
  }

  static fromLocationTo(sourcePath: string, destinationPath: string, previous?: Error): UnableToMoveFileException {
    const err = new UnableToMoveFileException(`Unable to move file from ${sourcePath} to ${destinationPath}`);
    err._source = sourcePath;
    err._destination = destinationPath;

    return err;
  }

  public operation(): string {
    return FilesystemOperationFailedException.OPERATION_MOVE;
  }
}
