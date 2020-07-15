/**
 * @file toReactive
 */

import {reactive} from 'vue-hooks-env';

export function toReactive<T>(obj: T): T {
    return reactive(obj) as T;
}
