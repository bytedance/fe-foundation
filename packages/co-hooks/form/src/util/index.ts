/**
 * @file index 工具函数
 */
import {NestWatcher} from '@co-hooks/nest-watcher';
import {FunctionAny} from '@co-hooks/util';
import {FormDomNode, FormNodeType} from '../types';

export function getRelativeKeys(node: FormDomNode): string[] {

    return node.getPathKeys(node => {

        const {type, repeat, field} = node.getValue();

        if (type === FormNodeType.ROOT) {
            return null;
        }

        if (node.parentNode && repeat) {
            return String(node.parentNode.getIndex(node));
        }

        return field !== '' ? field : null;
    });
}

export function getNestCachePath(node: FormDomNode): string[] {

    let res: string[] = [];
    let found = false;

    node.getPathKeys(node => {

        const {field, cache} = node.getValue();

        if (found) {
            return null;
        }


        if (cache != null) {
            found = true;
            return null;
        }


        if (field) {
            res.unshift(field);
        }

        return null;
    });

    if (!found) {
        return [];
    }

    return res;
}

export function getNestWatchPath(node: FormDomNode): string[] {

    let res: string[] = [];

    node.getPathKeys(node => {

        const {repeat, field} = node.getValue();

        if (node.parentNode && repeat) {
            res = [];
        } else if (field) {
            res.unshift(field);
        }

        return null;
    });

    return res;
}

// 包装后的函数
export type IWrappedReturnType<T> = T extends Promise<infer R> ? T : Promise<T>;

/**
 * 包装一个函数，变成Promise
 *
 * @param func 函数
 */
export function wrapFunction<T extends FunctionAny>(
    func: T
): (...args: Parameters<T>) => IWrappedReturnType<ReturnType<T>> {

    return (...args: Parameters<T>) => {

        try {

            const ret = func.call(null, ...args);

            if (ret != null && typeof ret === 'object' && typeof ret.then === 'function') {
                return ret;
            }

            return Promise.resolve(ret);
        } catch (e) {
            return Promise.reject(e);
        }
    };
}

export function processRelativeKey(node: FormDomNode, key: string): string {

    if (/^\.\//.test(key)) {

        key = key.slice(2);

        const scopeKeys = getRelativeKeys(node);

        return NestWatcher.combineKeys([...scopeKeys, ...NestWatcher.splitKey(key)]);
    }

    if (/^\.\.\//.test(key)) {
        const scopeKeys = getRelativeKeys(node);

        while (/^\.\.\//.test(key)) {
            scopeKeys.pop();
            key = key.slice(3);
        }

        return NestWatcher.combineKeys([...scopeKeys, ...NestWatcher.splitKey(key)]);
    }

    return key;
}

export function processNestWatcherKey(node: FormDomNode, key: string): string {

    // 以.开头表示当前路径下的相对路径
    if (/^\.\//.test(key)) {
        return NestWatcher.combineKeys(getNestWatchPath(node));
    }

    if (/^\.\.\//.test(key)) {

        const scopeKeys = getRelativeKeys(node);
        const nestKeys = getNestWatchPath(node);

        while (/^\.\.\//.test(key)) {
            key = key.slice(3);
            scopeKeys.pop();
        }

        return NestWatcher.combineKeys(scopeKeys.length < nestKeys.length ? scopeKeys : nestKeys);
    }

    return key;
}
