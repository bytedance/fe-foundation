/**
 * @file NestWatcher 监控属性用工具
 */

import {guid} from '@co-hooks/util';

// 用随机的ID作为ID， 可以有效的防止污染
export const FUNC_ID_KEY = guid();

// 监控的一些Flags
export interface IWatcherFlags {
    [key: string]: boolean;
}

// 监控函数，flags是一组用于内部定义的的参数，以方便不同的函数执行不同的行为
export type WatcherFunc = (changes: string[], flags: IWatcherFlags) => void | Promise<void>;

// 内置的监控信息
interface IWatcherInfo {

    // 纯属用于记录
    key: string;

    // 创建Id, 按model_path来标记
    creator: string;

    // 是否懒惰函数，Lazy的函数在一个EventLoop里面只会执行一次
    lazy: boolean;

    // 当前要Watch的字符串，直接使用数组，以加快效率
    keys: string[];

    // 当前监听的函数的编号
    guid: string;
}

interface IWatcherWaitInfo {

    // 纯属用于记录
    key: string;

    // 创建Id, 按model_path来标记
    creator: string;

    // 当前要Watch的字符串，直接使用数组，以加快效率
    keys: string[];

    // 当前监听的函数的编号
    func: VoidFunction;
}

// 监控函数信息
interface IWatcherFuncRef {

    // 当前监控函数的引用计数，方便销毁
    refs: number;
    func: WatcherFunc;
}

// 等待执行的publish信息
interface IWaitingInfo {
    flags: IWatcherFlags;
    changes: string[];
    guid: string;
}

export class NestWatcher {

    // 将Key数组合并成Key字符串
    public static combineKeys(keys: string[]): string {

        return keys.map(key => {

            const arr: string[] = [];
            let slash = false;

            for (let i = 0; i < key.length; i++) {

                const ch = key.charAt(i);

                if (!slash && ch === '.') {
                    arr.push('\\');
                }
                arr.push(ch);
                slash = ch === '\\';
            }

            return arr.join('');
        }).join('.');
    }

    // 将Key字符串分割成数组
    public static splitKey(key: string): string[] {

        const res: string[] = [];

        let slash = false;
        let str = '';

        for (let i = 0; i < key.length; i++) {

            const ch = key.charAt(i);

            if (slash && ch === '.') {
                str = str.slice(0, -1) + '.';
            } else if (ch === '.') {
                res.push(str);
                str = '';
            } else {
                str += ch;
            }

            slash = ch === '\\';
        }

        if (str) {
            res.push(str);
        }

        return res;
    }

    // 判断两组监控的Key是否匹配
    private static keysIsMatch(matchKeys: string[], originKeys: string[]): boolean {

        let i = 0;

        while (i < matchKeys.length && i < originKeys.length) {

            if (matchKeys[i] !== '*' && originKeys[i] !== '*' && originKeys[i] !== matchKeys[i]) {
                return false;
            }

            i++;
        }

        return true;
    }

    // 判断两组监控的Key是否匹配
    private static keyIsMatch(matchKey: string, originKey: string): boolean {
        return NestWatcher.keysIsMatch(NestWatcher.splitKey(matchKey), NestWatcher.splitKey(originKey));
    }

    // 合并触发的flags
    private static mergeFlags(flagsOrigin: IWatcherFlags, flagsMerge: IWatcherFlags): void {

        Object.keys(flagsMerge).forEach(key => {

            if (flagsMerge[key]) {
                flagsOrigin[key] = true;
            }
        });
    }

    // 给每一个函数打一个ID，避免多次调用
    private static getWatcherFuncId(func: unknown): string {

        const realFunc = func as {[key: string]: string};

        if (realFunc[FUNC_ID_KEY]) {
            return realFunc[FUNC_ID_KEY];
        }

        const id = guid();

        Object.defineProperty(func, FUNC_ID_KEY, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: id
        });

        return id;
    }

    // 所有监听的合集
    private readonly watchers: IWatcherInfo[] = [];

    // 所有监听的合集
    private waiting: IWatcherWaitInfo[] = [];

    // 所有监听函数的合集
    private readonly watcherFuncMap: {[key: string]: IWatcherFuncRef} = {};

    // 当前是否在分发中（函数还没执行阶段）
    private currentInDispatching: boolean = false;

    // 当前正在等待的变更（由用户行为触发的函数）
    private readonly waitingChanges: IWaitingInfo[] = [];

    // 当前正在等待执行的lazy函数
    private readonly waitingLazyChanges: IWaitingInfo[] = [];

    // 当前正在执行的函数数量（执行中阶段）
    private dispatchingCount: number = 0;

    // 当前正在Pending的Key列表
    private readonly pendingKeyList: string[] = [];

    /**
     * 添加处理中的Key
     *
     * @param key 要Pending的Key
     */
    public pendingKey(key: string): void {
        this.pendingKeyList.push(key);
    }

    /**
     * 添加处理中的Key
     *
     * @param key 要Pending的Key
     */
    public finishKey(key: string): void {

        const index = this.pendingKeyList.indexOf(key);

        if (index >= 0) {

            this.pendingKeyList.splice(index, 1);
            this.detectChangeList();

            // 处理所有的Waiting
            this.waiting = this.waiting.filter(item => {

                if (this.pendingKeyList.some(pending => NestWatcher.keyIsMatch(pending, item.key))) {
                    return true;
                }

                item.func();
                return false;
            });
        }
    }

    /**
     * 添加处理中的Key
     *
     * @param creator 创建人
     * @param key 要Pending的Key
     * @param func
     */
    public waitKey(creator: string, key: string, func: VoidFunction): void {
        this.waiting.push({
            creator,
            func,
            key,
            keys: NestWatcher.splitKey(key)
        });
    }

    /**
     * 注册一个Watcher
     *
     * @param creator 创建人
     * @param keys 监控的字段
     * @param func 监控函数
     * @param lazy 是否惰性函数
     */
    public register(creator: string, keys: string[], func: WatcherFunc, lazy: boolean = false): void {

        const id = NestWatcher.getWatcherFuncId(func);

        if (!this.watcherFuncMap[id]) {
            this.watcherFuncMap[id] = {
                refs: 0,
                func
            };
        }

        keys.forEach(key => {

            this.watcherFuncMap[id].refs++;
            this.watchers.push({
                key,
                creator,
                lazy,
                keys: NestWatcher.splitKey(key),
                guid: id
            });
        });
    }

    /**
     * 反注册Watcher
     *
     * @description 由于允许多变量，只能按函数+创建人解绑
     * @param creator 创建人
     * @param fn 要解绑的函数
     */
    public unregister(creator: string, fn?: WatcherFunc): void {

        const watchers = this.watchers;

        for (let i = watchers.length - 1; i >= 0; i--) {

            const watcher = watchers[i];

            if (watcher.creator === creator && (fn == null || watcher.guid === NestWatcher.getWatcherFuncId(fn))) {

                watchers.splice(i, 1);

                if (--this.watcherFuncMap[watcher.guid].refs <= 0) {
                    delete this.watcherFuncMap[watcher.guid];
                }
            }
        }
    }

    /**
     * 触发监听
     *
     * @param keys 触发的Keys
     * @param flags 触发的Flags
     */
    public notify(keys: string[], flags: IWatcherFlags = {}): void {

        // 整合WaitingInfo
        this.mergeWaitingInfo(keys.map(item => NestWatcher.splitKey(item)), flags);
        this.detectChangeList();
    }

    // 合并所有的Change
    private mergeWaitingInfo(changedKeys: string[][], flags: IWatcherFlags): void {

        this.watchers.forEach(watcher => {

            const matchedKeys = changedKeys.filter(keys => NestWatcher.keysIsMatch(keys, watcher.keys));

            if (!matchedKeys.length) {
                return;
            }

            const waitingList = watcher.lazy ? this.waitingLazyChanges : this.waitingChanges;
            const index = waitingList.findIndex(item => item.guid === watcher.guid);
            const conf: IWaitingInfo = index < 0
                ? {
                    changes: [],
                    guid: watcher.guid,
                    flags: {}
                }
                : waitingList[index];

            if (index < 0) {
                waitingList.push(conf);
            }

            NestWatcher.mergeFlags(conf.flags, flags);

            const child = matchedKeys.some(keys => keys.length > watcher.keys.length);

            if (child) {
                conf.flags.child = true;
            }

            matchedKeys.map(keys => {

                const key = keys.join('.');

                if (conf.changes.indexOf(key) < 0) {
                    conf.changes.push(key);
                }
            });
        });
    }

    // 尝试执行任务
    private processList(waiting: IWaitingInfo[]): void {

        waiting.forEach(item => {

            this.dispatchingCount++;

            // 触发是异步的
            const map = this.watcherFuncMap[item.guid];

            if (map == null) {
                return;
            }

            const res = map.func.call(null, item.changes, item.flags) || Promise.resolve();

            res
                .then(() => {
                    this.dispatchingCount--;
                    this.detectChangeList();
                })
                .catch(error => {

                    // 理论上说，错误应当由上边来控制，而不是由Watcher来
                    console.error('promise error is not caught');
                    console.log(error);
                    this.dispatchingCount--;
                    this.detectChangeList();
                });
        });
    }

    private isWaiting(info: IWaitingInfo): boolean {
        return info.changes.some(change => (
            this.pendingKeyList.some(pending => NestWatcher.keyIsMatch(pending, change))
        ));
    }

    private detectChangeList(): void {

        // 当前在执行中，插入到等待队列就结束了
        if (this.currentInDispatching) {
            return;
        }

        this.currentInDispatching = true;

        // 尝试执行任务（用setTimeout 0 来保证只会以宏任务来执行）
        setTimeout(() => {

            // 增加一个锁
            this.currentInDispatching = false;

            const waitingChanges = this.pickValidChanges(this.waitingChanges);

            if (waitingChanges.length) {
                this.processList(waitingChanges);
                return;
            }

            // 正在执行简单任务，或者已经在执行Lazy任务，不进行Lazy任务的执行
            if (this.dispatchingCount > 0) {
                return;
            }

            const waitingLazyChanges = this.pickValidChanges(this.waitingLazyChanges);

            if (waitingLazyChanges.length) {
                this.processList(waitingLazyChanges);
            }
        }, 0);
    }

    private pickValidChanges(list: IWaitingInfo[]): IWaitingInfo[] {

        const picked: IWaitingInfo[] = [];

        for (let i = list.length - 1; i >= 0; i--) {

            const change = list[i];

            if (!this.isWaiting(change)) {
                picked.push(change);
                list.splice(i, 1);
            }
        }

        return picked;
    }
}
