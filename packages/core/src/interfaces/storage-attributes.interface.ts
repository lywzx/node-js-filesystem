import { EFileType, EVisibility } from '../enum';

export interface IStorageAttributes {
  path: string;
  type: EFileType;
  visibility?: EVisibility;
  lastModified?: number;
  size?: number;
  isFile: boolean;
  isDir: boolean;
}
