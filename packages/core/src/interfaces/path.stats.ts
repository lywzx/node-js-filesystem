import { Stats } from 'fs';
import { Visibility } from '../enum';

export interface IPathStats {
  path: string;
  stats: Stats;
}

export interface IFileWithMimetype {
  path: string;
  type: 'file';
  mimetype?: string;
}

export interface IFileWithVisibility {
  path: string;
  visibility: Visibility | string;
}
