/**
 * @file pickReadonlyRefs
 */
import {Ref, computed} from 'vue-hooks-env';

export type Refs<T> = {
    readonly [K in keyof T]-?: Readonly<Ref<T[K]>>;
};

export function pickReadonlyRefs<T, K extends keyof T>(obj: T, keys: K[]): Refs<Pick<T, K>> {

    const res: {[key: string]: unknown} = {};

    keys.forEach(key => {
        res[key as string] = computed(() => obj[key]);
    });

    return res as Refs<T>;
}
