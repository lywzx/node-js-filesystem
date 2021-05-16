import { Visibility } from '../enum';

export interface IVisibilityConverter<T = any> {
  forFile(visibility: Visibility): T;
  forDirectory(visibility: Visibility): T;
  inverseForFile(visibility: T): Visibility;
  inverseForDirectory(visibility: T): Visibility;
  defaultForDirectories(): T;
}
