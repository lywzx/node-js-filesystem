import { FileType } from '../enum';

export type IListContentInfo = {
  basename?: string;
  path: string;
  type: FileType;
  timestamp?: number;
  size?: number;
};

/**
 * dir type
 */
export type DirType = {
  type: FileType.dir;
  path: string;
};
