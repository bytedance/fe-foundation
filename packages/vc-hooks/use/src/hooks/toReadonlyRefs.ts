/**
 * @file toReadonlyRefs
 */

import {RequiredKeys} from '@co-hooks/util';
import {Ref, computed} from 'vue-hooks-env';

export type NeedMergeProps<T> = Required<Omit<T, RequiredKeys<T>>>;

export type MergedRefs<T> = {
    readonly [K in keyof T]: Readonly<Ref<T[K]>>;
};

export function toReadonlyRefs<T>(obj: T, defaultValue: NeedMergeProps<T>): MergedRefs<Required<T>> {

    const res: Record<string, unknown> = {};
    const visited: Record<string, boolean> = {};

    [...Object.keys(defaultValue), ...Object.keys(obj)].forEach(key => {

        if (visited[key]) {
            return;
        }

        visited[key] = true;
        res[key] = computed(() => {
            const value = obj[key as keyof T];
            return value == null ? defaultValue[key as Exclude<keyof T, RequiredKeys<T>>] : value;
        });
    });

    return res as MergedRefs<Required<T>>;
}
