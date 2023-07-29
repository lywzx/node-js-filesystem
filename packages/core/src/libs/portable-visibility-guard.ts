import { EVisibility } from '../enum';

export class PortableVisibilityGuard {
  static guardAgainstInvalidInput(visibility: EVisibility): void {
    if (visibility !== EVisibility.PUBLIC && visibility !== EVisibility.PRIVATE) {
      throw new Error(
        `Invalid visibility provided. Expected either Visibility.PUBLIC or Visibility.PUBLIC, received ${visibility}`
      );
    }
  }
}
