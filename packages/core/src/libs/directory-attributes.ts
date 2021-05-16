import { IStorageAttributes } from '../interfaces';
import { FileType, Visibility } from '../enum';

export class DirectoryAttributes implements IStorageAttributes {
  isDir = true;
  isFile = false;
  type = FileType.file;

  constructor(public path: string, public visibility?: Visibility, public lastModified?: number) {}
}
