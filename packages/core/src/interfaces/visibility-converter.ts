import { EVisibility } from '../enum';

export interface IVisibilityConverter<T = any> {
  forFile(visibility: EVisibility): T;
  forDirectory(visibility: EVisibility): T;
  inverseForFile(visibility: T): EVisibility;
  inverseForDirectory(visibility: T): EVisibility;
  defaultForDirectories(): T;
}
