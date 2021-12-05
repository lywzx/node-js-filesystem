import { IVisibilityConverter } from '../../interfaces';
import { EVisibility } from '../../enum';
import { PortableVisibilityGuard } from '../portable-visibility-guard';

export interface IPortableVisibilityConfig<T = number> {
  [EVisibility.PUBLIC]?: T;
  [EVisibility.PRIVATE]?: T;
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
    protected readonly _defaultForDirectories = EVisibility.PRIVATE
  ) {}

  defaultForDirectories(): T {
    return this._defaultForDirectories === EVisibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  forDirectory(visibility: EVisibility): T {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === EVisibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  /**
   * def
   * @param visibility
   */
  forFile(visibility: EVisibility): T {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === EVisibility.PUBLIC ? this.filePublic : this.filePrivate;
  }

  inverseForDirectory(visibility: T): EVisibility {
    if (visibility === this.directoryPublic) {
      return EVisibility.PUBLIC;
    } else if (visibility === this.directoryPrivate) {
      return EVisibility.PRIVATE;
    }
    // default
    return EVisibility.PUBLIC;
  }

  inverseForFile(visibility: T): EVisibility {
    if (visibility === this.filePublic) {
      return EVisibility.PUBLIC;
    } else if (visibility === this.filePrivate) {
      return EVisibility.PRIVATE;
    }
    // default
    return EVisibility.PUBLIC;
  }

  static fromObject(permission: IPortableVisibilityObj, defaultForDirectories = EVisibility.PRIVATE) {
    return new PortableVisibilityConverter(
      permission.file?.public,
      permission.file?.private,
      permission.dir?.public,
      permission.dir?.private,
      defaultForDirectories
    );
  }
}
