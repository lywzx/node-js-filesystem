import { Readable } from 'stream';
import { castArray } from 'lodash';

/**
 * generate stream from string
 * @param contents
 */
export function stream_with_contents(contents: string | string[] = 'contents') {
  return new Readable({
    // eslint-disable-next-line no-unused-vars
    read(size: number) {
      castArray(contents).forEach((value) => {
        this.push(value);
      });
      this.push(null);
    },
  });
}
