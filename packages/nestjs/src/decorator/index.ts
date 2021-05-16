import { Inject } from '@nestjs/common';
import { generateInjectToken } from '../util';

/**
 * inject filesystem disk
 * @param diskName {string} file disk name
 * @constructor
 */
export const InjectFilesystem = (diskName?: string): ParameterDecorator => Inject(generateInjectToken(diskName));
