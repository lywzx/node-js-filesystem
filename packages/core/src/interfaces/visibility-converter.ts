import { Visibility } from '../enum';

export interface IVisibilityConverter {
  forFile(visibility: Visibility): number;
  forDirectory(visibility: Visibility): number;
  inverseForFile(visibility: number): Visibility;
  inverseForDirectory(visibility: number): Visibility;
  defaultForDirectories(): number;
}
