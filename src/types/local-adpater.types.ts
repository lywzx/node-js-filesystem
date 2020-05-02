import { ReadStream } from 'fs';
import { FileVisible } from '../enum';
import { FileType } from '../util/util';

export type ReadStreamResult = {
  type: string;
  path: string;
  stream: ReadStream;
};

export type VisibilityConfig = {
  visibility?: FileVisible | string;
};
export type WriteStreamConfig = {
  encoding?: string;
  flags?: string;
} & VisibilityConfig;

export type UpdateConfig = {
  mimetype?: boolean;
} & WriteConfig;

export type WriteConfig = {
  encoding?: string;
  flag?: string;
} & VisibilityConfig;

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
  timestamp: number;
  size: number;
};
export type FileInfo = {
  type: FileType;
  path: string;
  timestamp: number;
  size: number;
};

export type DirType = {
  type: 'dir';
  path: string;
};
