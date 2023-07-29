import { IStorageAttributes } from '../interfaces';
import { EFileType, EVisibility } from '../enum';

export class DirectoryAttributes implements IStorageAttributes {
  isDir = true;
  isFile = false;
  type = EFileType.file;

  constructor(public path: string, public visibility?: EVisibility, public lastModified?: number) {}
}
