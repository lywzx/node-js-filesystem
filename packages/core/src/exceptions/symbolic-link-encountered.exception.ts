import { FilesystemException } from './filesystem.exception';
import { bindErrorConstructor } from '../util/exception.util';

export class SymbolicLinkEncounteredException extends FilesystemException {
  constructor(message: string) {
    super(message);
    bindErrorConstructor(this, SymbolicLinkEncounteredException);
  }

  /**
   * @var string
   */
  private _location = '';

  public location(): string {
    return this._location;
  }

  static atLocation(pathName: string): SymbolicLinkEncounteredException {
    const e = new SymbolicLinkEncounteredException(`Unsupported symbolic link encountered at location ${pathName}`);
    e._location = pathName;

    return e;
  }
}
