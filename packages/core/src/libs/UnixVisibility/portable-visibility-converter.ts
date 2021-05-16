import { IVisibilityConverter } from '../../interfaces';
import { Visibility } from '../../enum';
import { PortableVisibilityGuard } from '../portable-visibility-guard';

export interface IPortableVisibilityConfig<T = number> {
  [Visibility.PUBLIC]?: T;
  [Visibility.PRIVATE]?: T;
}

export interface IPortableVisibilityObj<T = number> {
  file?: IPortableVisibilityConfig<T>;
  dir?: IPortableVisibilityConfig<T>;
}

export class PortableVisibilityConverter<T = number> implements IVisibilityConverter<T> {
  constructor(
    protected readonly filePublic: T = 0o0644 as any,
    protected readonly filePrivate: T = 0o0600 as any,
    protected readonly directoryPublic: T = 0o0755 as any,
    protected readonly directoryPrivate: T = 0o0700 as any,
    protected readonly _defaultForDirectories = Visibility.PRIVATE
  ) {}

  defaultForDirectories(): T {
    return this._defaultForDirectories === Visibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  forDirectory(visibility: Visibility): T {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === Visibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  /**
   * def
   * @param visibility
   */
  forFile(visibility: Visibility): T {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === Visibility.PUBLIC ? this.filePublic : this.filePrivate;
  }

  inverseForDirectory(visibility: T): Visibility {
    if (visibility === this.directoryPublic) {
      return Visibility.PUBLIC;
    } else if (visibility === this.directoryPrivate) {
      return Visibility.PRIVATE;
    }
    // default
    return Visibility.PUBLIC;
  }

  inverseForFile(visibility: T): Visibility {
    if (visibility === this.filePublic) {
      return Visibility.PUBLIC;
    } else if (visibility === this.filePrivate) {
      return Visibility.PRIVATE;
    }
    // default
    return Visibility.PUBLIC;
  }

  static fromObject(permission: IPortableVisibilityObj, defaultForDirectories = Visibility.PRIVATE) {
    return new PortableVisibilityConverter(
      permission.file?.public,
      permission.file?.private,
      permission.dir?.public,
      permission.dir?.private,
      defaultForDirectories
    );
  }
}
