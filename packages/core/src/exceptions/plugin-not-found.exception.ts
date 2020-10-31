export class PluginNotFoundException extends Error {
  constructor(plugin: string) {
    super(`Plugin not found for method: ${plugin}`);
    Object.setPrototypeOf(this, PluginNotFoundException.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = PluginNotFoundException.name;
  }
}
