import { ReadStream } from 'fs';
import { FileType, Visibility } from '../enum';
import { OPTION_DIRECTORY_VISIBILITY, OPTION_VISIBILITY } from '../constant';

export type ReadStreamResult = {
  type: string;
  path: string;
  stream: ReadStream;
};

/**
 * directory or file visibility
 */
export type IVisibilityConfig = {
  /**
   * file or directory default visibility
   */
  [OPTION_VISIBILITY]?: Visibility | string;
  /**
   * directory default visibility
   */
  [OPTION_DIRECTORY_VISIBILITY]?: Visibility | string;
};
export type IWriteStreamConfig = {
  encoding?: string;
  flags?: string;
} & IVisibilityConfig;

export type IWriteConfig = {
  encoding?: BufferEncoding;
  flag?: string;
} & IVisibilityConfig;

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
