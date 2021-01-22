import { IVisibilityConverter } from '../../interfaces/visibility-converter';
import { Visibility } from '../../enum';
import { PortableVisibilityGuard } from '../portable-visibility-guard';

export interface IPortableVisibilityConfig {
  [Visibility.PUBLIC]?: number;
  [Visibility.PRIVATE]?: number;
}

export interface IPortableVisibilityObj {
  file?: IPortableVisibilityConfig;
  dir?: IPortableVisibilityConfig;
}

export class PortableVisibilityConverter implements IVisibilityConverter {
  constructor(
    private readonly filePublic = 0o0644,
    private readonly filePrivate = 0o0600,
    private readonly directoryPublic = 0o0755,
    private readonly directoryPrivate = 0o0700,
    private readonly _defaultForDirectories = Visibility.PRIVATE
  ) {}

  defaultForDirectories(): number {
    return this._defaultForDirectories === Visibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  forDirectory(visibility: Visibility): number {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === Visibility.PUBLIC ? this.directoryPublic : this.directoryPrivate;
  }

  /**
   * def
   * @param visibility
   */
  forFile(visibility: Visibility): number {
    PortableVisibilityGuard.guardAgainstInvalidInput(visibility);
    return visibility === Visibility.PUBLIC ? this.filePublic : this.filePrivate;
  }

  inverseForDirectory(visibility: number): Visibility {
    if (visibility === this.directoryPublic) {
      return Visibility.PUBLIC;
    } else if (visibility === this.directoryPrivate) {
      return Visibility.PRIVATE;
    }
    // default
    return Visibility.PUBLIC;
  }

  inverseForFile(visibility: number): Visibility {
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
