import { Visibility } from '../enum';

export class PortableVisibilityGuard {
  static guardAgainstInvalidInput(visibility: Visibility): void {
    if (visibility !== Visibility.PUBLIC && visibility !== Visibility.PRIVATE) {
      throw new Error(
        `Invalid visibility provided. Expected either Visibility.PUBLIC or Visibility.PUBLIC, received ${visibility}`
      );
    }
  }
}
