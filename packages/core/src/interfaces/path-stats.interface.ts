import { Stats } from 'fs';
import { Visibility } from '../enum';

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
  visibility: Visibility | string;
}
