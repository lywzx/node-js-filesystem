import get from 'lodash/get';

/**
 *
 * @param pro
 */
export function promiseToBoolean(pro: Promise<any>): Promise<boolean> {
  return pro
    .then((response) => {
      return get(response, 'res.statusCode') === 200;
    })
    .catch(() => false);
}

export * from './ali-oss';
