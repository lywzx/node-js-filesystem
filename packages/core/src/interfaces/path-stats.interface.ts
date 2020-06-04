import { Stats } from 'fs';
import { FileVisible } from '../enum';

export interface PathStatsInterface {
  path: string;
  stats: Stats;
}

export interface FileWithMimetypeInterface {
  path: string;
  type: 'file';
  mimetype?: string;
}

export interface FileWithVisibilityInterface {
  path: string;
  visibility: FileVisible | string;
}
