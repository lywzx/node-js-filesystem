import { EFileType } from '../enum';

export type IListContentInfo = {
  basename?: string;
  path: string;
  type: EFileType;
  timestamp?: number;
  size?: number;
};

/**
 * dir type
 */
export type DirType = {
  type: EFileType.dir;
  path: string;
};
