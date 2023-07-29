import { Stats } from 'fs';
import { EVisibility } from '../enum';

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
  visibility: EVisibility | string;
}
