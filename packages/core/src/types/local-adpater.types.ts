import { ReadStream } from 'fs';
import { FileType, Visibility } from '../enum';
import { OPTION_DIRECTORY_VISIBILITY, OPTION_VISIBILITY } from '../constant';

export type ReadStreamResult = {
  type: string;
  path: string;
  stream: ReadStream;
};

export type IVisibilityConfig = {
  [OPTION_VISIBILITY]?: Visibility | string;
  [OPTION_DIRECTORY_VISIBILITY]?: Visibility | string;
};
export type IWriteStreamConfig = {
  encoding?: string;
  flags?: string;
} & IVisibilityConfig;

export type UpdateConfig = {
  mimetype?: boolean;
} & IWriteConfig;

export type IWriteConfig = {
  encoding?: BufferEncoding;
  flag?: string;
} & IVisibilityConfig;

export type UpdateFileResult = {
  type: string;
  path: string;
  size: number;
  contents: string | Buffer;
  mimetype?: string;
};
export type ReadFileResult = {
  type: string;
  path: string;
  contents: string | Buffer;
};
export type ListContentInfo = {
  basename?: string;
  path: string;
  type: FileType;
  timestamp?: number;
  size?: number;
};
export type FileInfo = {
  type: FileType;
  path: string;
  timestamp: number;
  size: number;
};

/**
 * dir type
 */
export type DirType = {
  type: FileType.dir;
  path: string;
};
