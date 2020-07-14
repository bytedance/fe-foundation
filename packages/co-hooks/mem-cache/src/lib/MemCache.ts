/**
 * @file MemCache 数据缓存
 */

import {deepClone} from '@co-hooks/util';

/**
 * 数据缓存
 */
export class MemCache<T> {

    /**
     * 当前缓存
     *
     */
    private cache: {[key: string]: T} = {};

    /**
     * 是否使用直接缓存
     */
    private readonly direct: boolean;

    /**
     * 构造函数
     *
     * @desc 如果direct为false，将使用deepClone进行复制，为了保证数据的一致性，请保证T的类型是JSON类型数据
     * @param direct 是否直接使用缓存
     */
    constructor(direct?: boolean) {
        this.direct = !!direct;
    }

    /**
     * 添加缓存
     *
     * @param key 添加key
     * @param value 值
     */
    public addCache(key: string, value: T): void {

        if (this.direct) {
            this.cache[key] = value;
            return;
        }

        // 这里面要有一个clone以防备子项目被篡改
        this.cache[key] = deepClone(value);
    }

    /**
     * 删除key
     *
     * @return 返回被删除的所有值
     */
    public removeCache(): {[key: string]: T};
    public removeCache(key: string): T;
    public removeCache(key?: string): T | {[key: string]: T} {

        if (key == null) {
            const all = this.cache;
            this.cache = {};
            return all;
        }

        const res = this.cache[key];
        delete this.cache[key];
        return res;
    }

    /**
     * 获取所有缓存
     *
     * @return 返回缓存的值
     */
    public getCache(): {[key: string]: T};

    /**
     * 获取cache
     *
     * @param key 缓存对应的key
     * @return 返回缓存的值
     */
    public getCache(key: string): T;

    public getCache(key?: string): T | {[key: string]: T} {

        const res = key != null ? this.cache[key] : this.cache;

        if (this.direct) {
            return res;
        }

        // 这里同样要有一个clone，以面返回的值互相影响
        return deepClone(res);
    }

    /**
     * 是否包含对应的缓存
     *
     * @param key 缓存名
     */
    public hasKey(key: string): boolean {
        return key in this.cache;
    }
}
