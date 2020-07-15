/**
 * @file unwrapRefMap
 */

import {getKeys} from '@co-hooks/util';
import {Refs} from './pickReadonlyRefs';

export function unwrapRefMap<T>(obj: Refs<T>): T {

    const res: Partial<T> = {};

    getKeys(obj).forEach(key => res[key] = obj[key].value);

    return res as T;
}

