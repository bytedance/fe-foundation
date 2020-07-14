/**
 * @file Watcher
 */

import {FUNC_ID_KEY, NestWatcher} from '../src';

describe('watcher test', () => {

    const testKeysIsMatch = [
        ['left empty', [], ['keys1'], true],
        ['left with *', ['*'], ['keys1'], true],
        ['left short', ['keys1'], ['keys1', 'keys2'], true],
        ['left * in middle', ['keys1', '*', 'keys2'], ['keys1', 'keys3', 'keys2'], true],
        ['left multiple *', ['keys1', '*', '*', 'keys2'], ['keys1', 'keys3', 'keys4', 'keys2'], true],
        ['left empty', ['keys1'], [], true],
        ['left with *', ['keys1'], ['*'], true],
        ['left short', ['keys1', 'keys2'], ['keys1'], true],
        ['left * in middle', ['keys1', 'keys3', 'keys2'], ['keys1', '*', 'keys2'], true],
        ['left multiple *', ['keys1', 'keys3', 'keys4', 'keys2'], ['keys1', '*', '*', 'keys2'], true],
        ['simple dismatch', ['keys2'], ['keys1'], false],
        ['middle dismatch', ['keys1', 'keys2'], ['keys1', 'keys3'], false]
    ];

    it.each(testKeysIsMatch)('keysIsMatch %s', (_, a, b, expected) => {

        expect((NestWatcher as any).keysIsMatch(a, b)).toBe(expected);
    });

    it('构造函数', () => {

        const watcher: any = new NestWatcher();

        expect(watcher.watchers).toEqual([]);
        expect(watcher.watcherFuncMap).toEqual({});
        expect(watcher.currentInDispatching).toBe(false);
        expect(watcher.currentInDispatching).toBe(false);
        expect(watcher.waitingChanges).toEqual([]);
        expect(watcher.dispatchingCount).toBe(0);
    });

    it('getWatcherFuncId 测试 - 缓存', () => {

        const fn = {
            [FUNC_ID_KEY]: '1'
        };

        expect((NestWatcher as any).getWatcherFuncId(fn)).toBe('1');
    });

    it('getWatcherFuncId 测试 - 新增', () => {

        const fn: any = {};
        const id = (NestWatcher as any).getWatcherFuncId(fn);
        const conf = Object.getOwnPropertyDescriptor(fn, FUNC_ID_KEY);

        expect(conf).not.toBeUndefined();

        if (conf) {
            expect(conf.value).toBe(id);
            expect(conf.configurable).toBe(false);
            expect(conf.enumerable).toBe(false);
            expect(conf.writable).toBe(false);
        }
    });

    it('getWatcherFuncId 测试 - 重复', () => {

        const fn: any = {};
        const id = (NestWatcher as any).getWatcherFuncId(fn);

        expect((NestWatcher as any).getWatcherFuncId(fn)).toBe(id);

        const conf = Object.getOwnPropertyDescriptor(fn, FUNC_ID_KEY);

        expect(conf).not.toBeUndefined();

        if (conf) {
            expect(conf.value).toBe(id);
            expect(conf.configurable).toBe(false);
            expect(conf.enumerable).toBe(false);
            expect(conf.writable).toBe(false);
        }
    });

    it('register 函数', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', [], fn);

        expect(watcher.watchers).toEqual([]);
        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 0,
                func: fn
            }
        });
    });

    it('register 函数 lazy', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['foo.bar'], fn, true);

        expect(watcher.watchers).toEqual([
            {
                key: 'foo.bar',
                keys: ['foo', 'bar'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: true
            }
        ]);
        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 1,
                func: fn
            }
        });
    });

    it('register 多次', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', [], fn);
        watcher.register('creator', [], fn);
        watcher.register('creator', [], fn);

        expect(watcher.watchers).toEqual([]);
        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 0,
                func: fn
            }
        });
    });

    it('register 次数', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['foo.bar', 'foo.baz'], fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'foo.bar',
                keys: ['foo', 'bar'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            },
            {
                key: 'foo.baz',
                keys: ['foo', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);
        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 2,
                func: fn
            }
        });
    });

    it('register 多模型', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['foo.baz', 'bar.baz'], fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'foo.baz',
                keys: ['foo', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            },
            {
                key: 'bar.baz',
                keys: ['bar', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);
        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 2,
                func: fn
            }
        });
    });

    it('unregister', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['context.baz'], fn);
        watcher.register('creator2', ['context.baz'], fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            },
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator2',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);

        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 2,
                func: fn
            }
        });

        watcher.unregister('creator');

        expect(watcher.watchers).toEqual([
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator2',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);

        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 1,
                func: fn
            }
        });
    });

    it('unregister fn', () => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['context.baz'], fn);
        watcher.register('creator2', ['context.baz'], fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            },
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator2',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);

        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 2,
                func: fn
            }
        });

        watcher.unregister('creator', fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator2',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);

        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 1,
                func: fn
            }
        });
    });

    it('unregister multiple', () => {
        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.register('creator', ['context.bar'], fn);
        watcher.register('creator', ['context.baz'], fn);

        expect(watcher.watchers).toEqual([
            {
                key: 'context.bar',
                keys: ['context', 'bar'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            },
            {
                key: 'context.baz',
                keys: ['context', 'baz'],
                creator: 'creator',
                guid: fn[FUNC_ID_KEY],
                lazy: false
            }
        ]);

        expect(watcher.watcherFuncMap).toEqual({
            [fn[FUNC_ID_KEY]]: {
                refs: 2,
                func: fn
            }
        });

        watcher.unregister('creator');

        expect(watcher.watchers).toEqual([]);

        expect(watcher.watcherFuncMap).toEqual({});
    });

    describe('notify base', () => {

        let watcher: any = new NestWatcher();
        const fn: any = () => null;

        beforeEach(() => {

            watcher = new NestWatcher();

            watcher.processList = () => null;

            watcher.register('creator', ['context.a', 'context.b'], fn);
        });

        it('notify empty', () => {

            watcher.notify([]);

            expect(watcher.waitingChanges).toEqual([]);
        });

        it('notify one', () => {

            watcher.notify(['context.a'], {
                manual: true
            });

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a'],
                    flags: {
                        manual: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify multiple', () => {

            watcher.notify(['context.a', 'context.b'], {
                reset: true,
                dispose: true
            });

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a', 'context.b'],
                    flags: {
                        reset: true,
                        dispose: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify multiple', () => {

            watcher.notify(['context.a'], {manual: true});
            watcher.notify(['context.b'], {dispose: true});

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify children', () => {

            watcher.notify(['context.a.c'], {manual: true});
            watcher.notify(['context.b'], {dispose: true});

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });
    });

    describe('notify base lazy', () => {

        let watcher: any = new NestWatcher();
        const fn: any = () => null;

        beforeEach(() => {

            watcher = new NestWatcher();

            watcher.processLazyList = () => null;

            watcher.register('creator', ['context.a', 'context.b'], fn, true);
        });

        it('notify empty', () => {

            watcher.notify([]);

            expect(watcher.waitingLazyChanges).toEqual([]);
        });

        it('notify one', () => {

            watcher.notify(['context.a'], {
                manual: true
            });

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a'],
                    flags: {
                        manual: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify multiple', () => {

            watcher.notify(['context.a', 'context.b'], {
                reset: true,
                dispose: true
            });

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a', 'context.b'],
                    flags: {
                        reset: true,
                        dispose: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify multiple', () => {

            watcher.notify(['context.a'], {manual: true});
            watcher.notify(['context.b'], {dispose: true});

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });

        it('notify children', () => {

            watcher.notify(['context.a.c'], {manual: true});
            watcher.notify(['context.b'], {dispose: true});

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);
        });
    });

    it('notify call processList', done => {

        const watcher: any = new NestWatcher();
        const fn: any = () => null;

        watcher.processList = () => {

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);

            done();
        };

        watcher.register('creator', ['context.a', 'context.b'], fn);

        watcher.notify(['context.a.c'], {manual: true});
        watcher.notify(['context.b'], {dispose: true});
    });

    it('notify fn', done => {

        expect.assertions(4);

        const watcher: any = new NestWatcher();
        const fn: any = (changes: string[], flags: {[key: string]: boolean}) => {
            expect(changes).toEqual(['context.a.c', 'context.b']);
            expect(flags).toEqual({
                manual: true,
                dispose: true,
                child: true
            });

            return Promise.resolve();
        };

        const old = watcher.processList;

        watcher.processList = () => {

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);

            old.call(watcher);

            expect(watcher.waitingChanges).toEqual([]);
            done();
        };

        watcher.register('creator', ['context.a', 'context.b'], fn);

        watcher.notify(['context.a.c'], {manual: true});
        watcher.notify(['context.b'], {dispose: true});
    });

    it('notify fn reject', done => {

        expect.assertions(4);

        const watcher: any = new NestWatcher();
        const fn: any = (changes: string[], flags: {[key: string]: boolean}) => {
            expect(changes).toEqual(['context.a.c', 'context.b']);
            expect(flags).toEqual({
                manual: true,
                dispose: true,
                child: true
            });

            return Promise.reject();
        };

        const old = watcher.processList;

        watcher.processList = () => {

            expect(watcher.waitingChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);

            old.call(watcher);

            expect(watcher.waitingChanges).toEqual([]);
            done();
        };

        watcher.register('creator', ['context.a', 'context.b'], fn);

        watcher.notify(['context.a.c'], {manual: true});
        watcher.notify(['context.b'], {dispose: true});
    });

    it('notify lazy fn', done => {

        expect.assertions(4);

        const watcher: any = new NestWatcher();
        const fn: any = (changes: string[], flags: {[key: string]: boolean}) => {
            expect(changes).toEqual(['context.a.c', 'context.b']);
            expect(flags).toEqual({
                manual: true,
                dispose: true,
                child: true
            });

            return Promise.resolve();
        };

        const old = watcher.processLazyList;

        watcher.processLazyList = () => {

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);

            old.call(watcher);

            expect(watcher.waitingLazyChanges).toEqual([]);
            done();
        };

        watcher.register('creator', ['context.a', 'context.b'], fn, true);

        watcher.notify(['context.a.c'], {manual: true});
        watcher.notify(['context.b'], {dispose: true});
    });

    it('notify lazy fn reject', done => {

        expect.assertions(4);

        const watcher: any = new NestWatcher();
        const fn: any = (changes: string[], flags: {[key: string]: boolean}) => {
            expect(changes).toEqual(['context.a.c', 'context.b']);
            expect(flags).toEqual({
                manual: true,
                dispose: true,
                child: true
            });

            return Promise.reject();
        };

        const old = watcher.processLazyList;

        watcher.processLazyList = () => {

            expect(watcher.waitingLazyChanges).toEqual([
                {
                    changes: ['context.a.c', 'context.b'],
                    flags: {
                        manual: true,
                        dispose: true,
                        child: true
                    },
                    guid: fn[FUNC_ID_KEY]
                }
            ]);

            old.call(watcher);

            expect(watcher.waitingLazyChanges).toEqual([]);
            done();
        };

        watcher.register('creator', ['context.a', 'context.b'], fn, true);

        watcher.notify(['context.a.c'], {manual: true});
        watcher.notify(['context.b'], {dispose: true});
    });
});
