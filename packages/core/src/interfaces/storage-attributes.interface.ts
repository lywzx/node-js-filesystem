import { FileType, Visibility } from '../enum';

export interface IStorageAttributes {
  path: string;
  type: FileType;
  visibility?: Visibility;
  lastModified?: number;
  size?: number;
  isFile: boolean;
  isDir: boolean;
}
