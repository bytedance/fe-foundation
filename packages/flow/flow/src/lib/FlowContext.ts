/**
 * @file Context 当前页面的上下文
 */

import {IDatasourceConfig} from '@chief-editor/base';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {FunctionAny, deepClone} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {bindDatasourceLoader} from '../datasource/bind';
import {funcDatasourceLoader} from '../datasource/func';
import {localDatasourceLoader} from '../datasource/local';
import {DatasourceLoader, FlowDatasource, IFlowBrickConfigGlobal} from '../types';
import {FlowModel, IModelOptions} from './FlowModel';
import {FlowScheduler} from './FlowScheduler';

export interface IContextOptions {
    context?: FlowContextInfo;
    hooks?: Record<string, FunctionAny>;
    loaders?: Record<string, DatasourceLoader>;
    brickConfigs?: Record<string, IFlowBrickConfigGlobal>;
}

export interface IContextEvents {
    'context-change': [string[]];
}

export type FlowContextInfo = Record<string, unknown>;

export class FlowContext extends Emitter<IContextEvents> {

    // 上下文配置
    private readonly context: FlowContextInfo;

    // 钩子配置
    private readonly hooks: Record<string, FunctionAny>;

    // 组件配置
    private readonly brickConfigs: Record<string, IFlowBrickConfigGlobal>;

    // 数据模型缓存
    private readonly modelMap: Record<string, FlowModel> = {};

    // Watcher本身变得无状态，并且轻量，可以提高效率
    private readonly watcher: NestWatcher = new NestWatcher();

    // 数据源处理类
    private readonly loaders: Record<string, DatasourceLoader> = {};

    /**
     * 构造函数
     *
     * @param context 全局状态
     * @param hooks 全局钩子
     * @param loaders 全局数据加载器
     * @param brickConfigs 全局使用的组件配置
     */
    constructor({context = {}, hooks = {}, loaders = {}, brickConfigs = {}}: IContextOptions) {

        super();

        this.context = context;
        this.hooks = hooks;
        this.brickConfigs = brickConfigs;
        this.loaders = {
            local: localDatasourceLoader,
            bind: bindDatasourceLoader,
            func: funcDatasourceLoader,
            ...loaders
        };
    }

    /**
     * 设置上下文
     *
     * @param key 要设置的Key
     * @param value 要设置的值
     */
    public setContext(key: string, value?: unknown): void;

    /**
     * 设置上下文
     *
     * @param context 上下文集合对象
     */
    public setContext(context: FlowContextInfo): void;

    public setContext(key: string | FlowContextInfo, value?: unknown): void {

        const keys = typeof key === 'string'
            ? value === this.context[key] ? [] : [key]
            : Object.keys(key).filter(item => this.context[item] !== key[item]);

        // 合并所有的变更
        if (typeof key === 'string') {
            Object.assign(this.context, {[key]: value});
        } else {
            Object.assign(this.context, key);
        }

        if (keys.length) {
            this.watcher.notify(keys.map(item => NestWatcher.combineKeys(['context', item])));
            this.emit('context-change', keys);
        }
    }

    /**
     * 获取上下文
     *
     * @param key 要获取的Key
     * @param isDirect
     */
    public getContext(key: string, isDirect?: boolean): unknown;

    /**
     * 获取上下文
     *
     * @param isDirect 是否直接获取
     */
    public getContext(isDirect?: boolean): FlowContextInfo;

    /**
     * 获取上下文
     *
     * @param  key 要获取的key
     * @param isDirect 是否直接获取
     * @return 返回获取的值
     */
    public getContext(key: string | boolean = false, isDirect: boolean = false): unknown {

        if (typeof key === 'boolean') {
            isDirect = key;
        }

        const value = typeof key === 'string' ? this.context[key] : this.context;
        return isDirect ? value : deepClone(value);
    }

    /**
     * 获取钩子
     *
     */
    public getHook(key: string): FunctionAny | null {

        const hookFn = this.hooks[key];

        if (!hookFn) {
            return null;
        }

        return hookFn;
    }

    /**
     * 获取钩子
     *
     */
    public getHooks(): {[key: string]: FunctionAny} {
        return this.hooks;
    }

    public getLoader<V, DS, DP, CG, ST>(
        config: IDatasourceConfig<V, DS>,
        scheduler: FlowScheduler<V, DS, DP, CG, ST>
    ): FlowDatasource<V, DS, DP, CG, ST> {

        if (!this.loaders[config.type]) {
            throw new Error(`loader name = ${config.type} is not found`);
        }

        return this.loaders[config.type](scheduler, config);
    }

    /**
     * 获取组件配置
     *
     * @param type 组件类型
     */
    public getBrickConfig(type: string): IFlowBrickConfigGlobal {

        if (this.brickConfigs[type] == null) {
            throw new Error(`Brick: ${type} is not found`);
        }

        return this.brickConfigs[type];
    }

    /**
     * 获取全部组件配置
     *
     */
    public getBrickConfigs(): Record<string, IFlowBrickConfigGlobal> {
        return this.brickConfigs;
    }

    /**
     * 获取Watcher
     */
    public getWatcher(): NestWatcher {
        return this.watcher;
    }

    /**
     * 创建一个子数据模型
     *
     * @param opts 模型名字或者模型
     * @return 返回一个模型
     */
    public createModel(opts: string | Omit<IModelOptions, 'context'>): FlowModel {

        if (typeof opts === 'string') {
            opts = {name: opts};
        }

        if (this.modelMap[opts.name]) {
            console.error('duplicate model name:' + opts.name);
        }

        return this.modelMap[opts.name] = new FlowModel({
            context: this,
            ...opts
        });
    }

    /**
     * 删除一个子模型
     *
     * @param name 模型名字
     */
    public removeModel(name: string): void {
        this.modelMap[name].dispose();
        delete this.modelMap[name];
    }

    /**
     * 获取一个数据模型
     *
     * @param name 模型名字
     * @return 返回一个模型
     */
    public getModel(name: string): FlowModel {
        return this.modelMap[name];
    }
}
