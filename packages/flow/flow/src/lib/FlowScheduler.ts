/**
 * @file FlowScheduler
 */

import {
    BaseBrick,
    IBoardData,
    IBrickData,
    IBrickInfo,
    IBrickPartConfig,
    IValidateInfo,
    NodeType,
    Scheduler, extractStaticConfig
} from '@chief-editor/base';
import {ILayoutConfig} from '@chief-editor/types';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {PriorityQueue} from '@co-hooks/priority-queue';
import {FunctionAny, guid} from '@co-hooks/util';
import {IFlowValidate, extractValidate, getDefaultValidate} from '../config/validate';
import {IFlowHooksMap, extractHooks} from '../config/hooks';
import {getAbsoluteKey, getWatchableKeys} from '../util/keys';
import {FlowDatasource, IFlowBrickConfig, IFlowPartMapInfo} from '../types';
import {IFlowEventMap, extractEvents} from '../config/events';
import {wrapFunction, wrapJson} from '../util/wrap';
import {FlowBrick} from './FlowBrick';
import {FlowModel} from './FlowModel';

export interface IFlowSchedulerOptions<V, DS, DP, CG, ST> {
    brickConfig: IFlowBrickConfig<V, DS, DP, CG, ST>;
    model: FlowModel;
}

export interface IFlowWatcher {
    watchers: string[];
    func: FunctionAny;
    immediate?: boolean;
    lazy?: boolean;
}

export class FlowScheduler<V, DS, DP, CG, ST> implements Scheduler<V, DS, DP, CG, ST> {


    private watcherId: string = guid();

    private readonly brickConfig: IFlowBrickConfig<V, DS, DP, CG, ST>;

    private readonly model: FlowModel;

    private events: IFlowEventMap = {};

    private hooks: IFlowHooksMap = {};

    private validator: IFlowValidate = getDefaultValidate();

    private pending: IFlowWatcher[] = [];

    private loader?: FlowDatasource<V, DS, DP, CG, ST>;

    private readonly queue: PriorityQueue;

    constructor(options: IFlowSchedulerOptions<V, DS, DP, CG, ST>) {
        this.brickConfig = options.brickConfig;
        this.model = options.model;
        this.queue = this.initPriorityQueue();
    }

    public initBrickData(brick: BaseBrick<V, DS, DP, CG, ST>, data: IBrickData<V, DS, DP, CG, ST>): IBrickInfo {

        Object.assign(this, {brick});

        this.data = data;

        const {
            id = guid(),
            type,
            info: {
                field,
                label,
                lock = false
            }
        } = data;

        return {
            id,
            creator: guid(),
            label,
            readonly: !field,
            brickType: type,
            field,
            env: 'flow',
            virtual: false,
            lock
        };
    }

    public getBrickData(): Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'> {
        return this.data;
    }

    public getPartList(): IBrickPartConfig[] {

        const parts = this.data.parts;

        if (!parts) {
            return [];
        }

        const keys: IFlowPartMapInfo[] = this.brickConfig.getPartKeyMapFromBrickData
            ? this.brickConfig.getPartKeyMapFromBrickData(this.brick)
            : Object.keys(parts).map(item => ({key: item, part: item, repeat: false, field: undefined}));

        return keys.map(({key, part, field, bricks, repeat = false}) => {

            const config = this.brickConfig.getPartBoardInfoFromBrickData(this.brick, part);
            const data: IBoardData = {
                bricks: bricks || []
            };

            if (parts[part]) {

                if (!bricks) {
                    data.bricks = parts[part].bricks;
                }

                data.id = parts[part].id;
            }

            return ({
                key,
                repeat,
                field,
                ...data,
                ...(config == null ? {type: NodeType.STREAM} : config)
            });
        });
    }

    public isPartDynamic(): boolean {
        return this.brickConfig.getPartKeyMapFromBrickData != null;
    }

    public setState(state: Partial<ST>): void {
        this.brick.updateBrickInstance({
            state: {
                ...this.brick.state,
                ...state
            }
        });
    }

    public setValue(value: V, manual?: boolean, isSilent?: boolean): void {
        this.model.setValueByPath(this.brick, value, manual, isSilent);
    }

    // 获取数据源
    public getDatasource(data: unknown): void {
        this.queue.executeAsync('datasource', data);
    }

    // 分发事件
    public dispatchEvent(name: string | Event, param?: unknown): void {
        const evtName = typeof name === 'string' ? name : name.type;
        this.events[evtName] && this.events[evtName](name, param);
    }

    // 设置钩子
    public getHook(name: string): FunctionAny | null {
        return this.model.getOwnerContext().getHook(name);
    }

    // 销毁组件
    public dispose(): void {
        this.model.getWatcher().unregister(this.brick.creator);
    }

    public initStaticBrickData(): void {

        const {brick} = this;

        this.extractBrickData();

        const {
            config,
            layout,
            styles
        } = this.data;

        // 初始化静态数据
        if (this.loader) {

            const staticDatasource = this.loader.loadStaticDatasource() || this.brickConfig.getInitialDatasource();

            brick.updateBrickInstance({
                datasource: staticDatasource,
                staticDatasource
            }, true);
        }

        // 初始化状态
        // layout不参与绑定
        brick.updateBrickInstance({
            layout,
            config: extractStaticConfig(config),
            styles: extractStaticConfig(styles),
            state: this.brickConfig.getInitialState()
        }, true);

        // 初始化数值
        if (!brick.readonly) {

            if (this.loader && this.loader.loadStaticDefaultValue) {
                brick.updateBrickInstance({
                    value: this.loader.loadStaticDefaultValue()
                }, true);

                // model没有初始值，设置默认初始值
                if (this.model.getValueByBrick(brick) == null) {
                    this.setValue(brick.value, true, true);
                }
            } else {
                brick.updateBrickInstance({
                    value: this.brickConfig.getDefaultValue()
                }, true);

                // model没有初始值，设置默认初始值
                if (this.model.getValueByBrick(brick) == null) {
                    this.setValue(this.brickConfig.getDynamicDefaultValue(brick), true, true);
                }
            }
        }
    }

    public init(): void {
        this.loadBrickScheduler();
    }

    public updateBrickData(data: IBrickData<V, DS, DP, CG, ST>): void {
        this.data = data;
        data.id = this.brick.id;

        const {
            id = guid(),
            type,
            info: {
                field,
                label
            }
        } = data;

        // 重新执行一下初始化
        this.brick.updateBrickInstance({
            id,
            creator: guid(),
            label,
            readonly: !field,
            brickType: type,
            field,
            env: 'flow',
            virtual: false
        }, true);

        // 重新初始化静态信息
        this.initStaticBrickData();

        // 重新加载数据
        this.loadBrickScheduler();
    }

    public setBrickLayout(layout: ILayoutConfig): void {
        this.brick.updateBrickInstance({layout: Object.assign({}, this.brick.layout, layout)});
    }

    public getByExpression(...expression: Array<string | number>): any {
        return this.brick.getByExpression(...expression);
    }

    private executeHook(key: string, params: unknown): Promise<unknown> {

        if (!this.hooks[key]) {
            return Promise.resolve(params);
        }

        return this.hooks[key](params);
    }

    private extractBrickData(): void {

        // 销毁旧的数据
        this.pending = [];
        this.model.getWatcher().unregister(this.watcherId);
        this.watcherId = guid();

        const {brick, data} = this;

        // 初始化事件
        this.events = extractEvents(brick, data.events);

        // 初始化生命周期
        this.hooks = extractHooks(brick, this.brickConfig, data.hooks);

        // 初始化数据加载器
        if (data.datasource) {
            this.loader = this.model.getOwnerContext().getLoader(data.datasource, this);

            if (this.loader.watcher) {
                this.pending.push({
                    watchers: this.loader.watcher,
                    func: () => this.queue.execute('datasource', {})
                });
            }
        }

        // 初始化校验器
        this.validator = extractValidate(brick, data.validate);

        // 初始化配置
        this.initConfig();
    }

    // 初始化配置信息
    private initConfig(): void {

        const {config, styles} = this.data;

        const {
            watchers,
            func,
            asyncMap
        } = wrapJson({config, styles}, this.brick);

        const keys = Object.keys(asyncMap);

        const asyncFuncMap: Record<string, unknown> = {};

        const execute = wrapFunction(() => {
            try {
                this.brick.updateBrickInstance(func(asyncFuncMap));
            } catch (e) {
                console.warn(e);
                console.warn(`execute prop expression error: ${e.msg}`);
                this.brick.updateBrickInstance({
                    config: extractStaticConfig(config),
                    styles: extractStaticConfig(styles)
                });
            }
        }, this.brick);

        if (!keys.length) {

            this.pending.push({
                func: execute,
                watchers,
                immediate: true,
                lazy: false
            });

            return;
        }

        keys.forEach(key => {

            if (asyncMap[key].watchers) {

                // 远程函数会尽量节流
                this.pending.push({
                    func: () => asyncMap[key]
                        .func()
                        .then(value => asyncFuncMap[key] = value)
                        .catch(e => {
                            console.warn(e);
                            console.warn(`execute prop expression error: ${e.msg}`);
                        })
                        .then(execute),
                    watchers: asyncMap[key].watchers,
                    immediate: false,
                    lazy: true
                });
            }
        });

        const init = false;

        this.pending.push({
            watchers,
            func: () => {

                if (init) {
                    return execute();
                }

                return Promise.all(
                    keys.map(key => asyncMap[key]
                        .func()
                        .then((value: unknown) => asyncFuncMap[key] = value)
                        .catch((e: unknown) => {
                            console.warn(e);
                            console.warn('execute prop expression error');
                        }))
                ).then(execute);
            },
            immediate: true
        });
    }

    private loadBrickScheduler(): void {

        const {brick} = this;

        // 获取数据先行
        this.queue
            .execute('datasource', {})
            .then(() => {

                const pending = this.pending;
                this.pending = [];
                const immediate: FunctionAny[] = [];

                pending.forEach(item => {

                    this.model.getWatcher().register(this.watcherId, item.watchers, item.func, item.lazy);

                    if (item.immediate) {
                        immediate.push(item.func);
                    }
                });

                return Promise.all(immediate.map(item => item()));
            })
            .then(() => {

                // 初始化默认值
                let modelValue = this.model.getValueByBrick(brick, true);


                // 注册数据监听回调
                if (!this.brick.readonly) {

                    const defaultValue = this.brickConfig.getDynamicDefaultValue(brick);
                    const value = modelValue === undefined ? defaultValue : modelValue;

                    if (value !== modelValue) {
                        modelValue = value;
                        this.model.setValueByPath(this.brick, value, false, true);
                    }

                    this.model.getWatcher().register(
                        brick.creator,
                        [NestWatcher.combineKeys([this.model.name, ...getWatchableKeys(brick.getNode())])],
                        () => {

                            const value = this.model.getValueByBrick(brick, true);

                            if (value !== brick.value) {
                                brick.updateBrickInstance({
                                    value
                                });
                            }

                            return Promise.resolve();
                        }
                    );
                }

                this.brick.updateBrickInstance({
                    state: this.brickConfig.getDynamicInitialState(this.brick),
                    value: modelValue,
                    validateInfo: getDefaultValidateInfo(),
                    validating: false,
                    ready: true
                });

                this.model.getWatcher().finishKey(getAbsoluteKey(this.brick));
            })
            .catch(console.log);
    }

    private initPriorityQueue(): PriorityQueue {

        return new PriorityQueue([
            {
                key: 'datasource',
                fn: (_, payload: unknown) => this.getDatasourceTask(payload)
            }
        ]);
    }

    private getDatasourceTask(data: unknown): Promise<void> {

        const loader = this.loader;

        if (!loader) {
            return Promise.resolve();
        }

        const loadDynamicDatasource = loader.loadDynamicDatasource;

        if (!loadDynamicDatasource) {
            return Promise.resolve();
        }

        const {updateWhenLoading} = this.brickConfig.getRenderConfig(this.brick);

        this.brick.updateBrickInstance({loading: true}, !updateWhenLoading);

        return this.executeHook('onBeforeGetDatasource', data)
            .then(data => loadDynamicDatasource(data))
            .then(datasource => {
                this.brick.updateBrickInstance({datasource});
                return this.executeHook('onAfterGetDatasource', datasource);
            })
            .then(() => this.brick.updateBrickInstance({loading: false}, !updateWhenLoading));
    }
}

export interface FlowScheduler<V, DS, DP, CG, ST> {
    readonly brick: FlowBrick<V, DS, DP, CG, ST>;
    data: IBrickData<V, DS, DP, CG, ST>;
}

export function getDefaultValidateInfo(): IValidateInfo {
    return {
        catchable: false,
        needValidate: false,
        partial: false,
        valid: true,
        error: '',
        children: []
    };
}
