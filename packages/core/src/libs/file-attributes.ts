import { IStorageAttributes } from '../interfaces';
import { EFileType, EVisibility } from '../enum';

export class FileAttributes implements IStorageAttributes {
  isDir = false;
  isFile = true;
  type = EFileType.file;

  constructor(
    public path: string,
    public fileSize?: number,
    public visibility?: EVisibility,
    public lastModified?: number,
    public mimeType?: string,
    public extraMetadata: Record<string, any> = {}
  ) {}
}
