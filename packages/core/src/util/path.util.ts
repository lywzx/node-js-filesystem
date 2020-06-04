/**
 * normalize dirname
 * @param dirname
 */
export function normalizeDirname(dirname: string) {
  return dirname === '.' ? '' : dirname;
}
