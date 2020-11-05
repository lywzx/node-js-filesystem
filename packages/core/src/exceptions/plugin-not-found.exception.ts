import { bindErrorConstructor } from '../util/exception.util';

export class PluginNotFoundException extends Error {
  constructor(plugin: string) {
    super(`Plugin not found for method: ${plugin}`);
    bindErrorConstructor(this, PluginNotFoundException);
  }
}
