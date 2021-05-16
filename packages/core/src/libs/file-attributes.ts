import { IStorageAttributes } from '../interfaces';
import { FileType, Visibility } from '../enum';

export class FileAttributes implements IStorageAttributes {
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
