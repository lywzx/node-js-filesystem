import { Exception } from '@filesystem/core';

export class ConnectionException extends Exception {
  constructor(message?: string) {
    super(message);
  }
}
