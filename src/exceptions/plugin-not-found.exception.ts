export class PluginNotFoundException extends Error {
  constructor(plugin: string) {
    super(`Plugin not found for method: ${plugin}`);
    this.name = PluginNotFoundException.name;
  }
}
