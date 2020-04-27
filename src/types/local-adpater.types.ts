import { ReadStream } from 'fs';
import { FileVisible } from '../enum';
import { FileType } from '../util/util';

export type ReadStreamResult = {
  type: string;
  path: string;
  stream: ReadStream;
};

export type WriteConfig = {
  visibility?: FileVisible;
};

export type UpdateFileResult = {
  type: string;
  path: string;
  size: number;
  contents: string;
  mimetype: string;
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
