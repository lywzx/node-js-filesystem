import { IStorageAttributes } from '../interfaces/storage-attributes.interface';
import { FileType, Visibility } from '../enum';

export class FileAttributes implements IStorageAttributes {
  static ATTRIBUTE_PATH = 'path';
  static ATTRIBUTE_TYPE = 'type';
  static ATTRIBUTE_FILE_SIZE = 'file_size';
  static ATTRIBUTE_VISIBILITY = 'visibility';
  static ATTRIBUTE_LAST_MODIFIED = 'last_modified';
  static ATTRIBUTE_MIME_TYPE = 'mime_type';
  static ATTRIBUTE_EXTRA_METADATA = 'extra_metadata';

  isDir = false;
  isFile = true;
  type = FileType.file;

  constructor(
    public path: string,
    public fileSize?: number,
    public visibility?: Visibility,
    public lastModified?: number,
    public mimeType?: string,
    public extraMetadata: Record<string, any> = {}
  ) {}
}
