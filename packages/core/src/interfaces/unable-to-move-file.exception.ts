import { FilesystemOperationFailedException } from '../exceptions/filesystem-operation-failed.exception';

export class UnableToMoveFileException extends FilesystemOperationFailedException {
  /**
   * @var string
   */
  private _source = '';

  /**
   * @var string
   */
  private _destination = '';

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
