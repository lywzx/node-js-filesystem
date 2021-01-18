import { FilesystemOperationFailedException } from './filesystem-operation-failed.exception';
import { FileAttributes } from '../libs/file-attributes';

export class UnableToRetrieveMetadataException extends FilesystemOperationFailedException {
  /**
   * @var string
   */
  private _location = '';

  /**
   * @var string
   */
  private _metadataType = '';

  /**
   * @var string
   */
  private _reason = '';

  static lastModified(location: string, reason = '', previous: Error | null = null): UnableToRetrieveMetadataException {
    return this.create(location, FileAttributes.ATTRIBUTE_LAST_MODIFIED, reason, previous);
  }

  static visibility(location: string, reason = '', previous: Error | null = null): UnableToRetrieveMetadataException {
    return this.create(location, FileAttributes.ATTRIBUTE_VISIBILITY, reason, previous);
  }

  static fileSize(location: string, reason = '', previous: Error | null = null): UnableToRetrieveMetadataException {
    return this.create(location, FileAttributes.ATTRIBUTE_FILE_SIZE, reason, previous);
  }

  static mimeType(location: string, reason = '', previous: Error | null = null): UnableToRetrieveMetadataException {
    return this.create(location, FileAttributes.ATTRIBUTE_MIME_TYPE, reason, previous);
  }

  static create(
    location: string,
    type: string,
    reason = '',
    previous: Error | null = null
  ): UnableToRetrieveMetadataException {
    const e = new UnableToRetrieveMetadataException(
      `Unable to retrieve the $type for file at location: ${location}. ${reason}`
    );
    e._reason = reason;
    e._location = location;
    e._metadataType = type;

    return e;
  }

  public reason(): string {
    return this._reason;
  }

  public location(): string {
    return this._location;
  }

  public metadataType(): string {
    return this._metadataType;
  }

  public operation(): string {
    return FilesystemOperationFailedException.OPERATION_RETRIEVE_METADATA;
  }
}
