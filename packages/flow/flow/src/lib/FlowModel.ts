/**
 * @file model 数据模型
 */

import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {IWatcherFlags, NestWatcher, WatcherFunc} from '@co-hooks/nest-watcher';
import {FunctionAny, deepClone, getObjectProperty, setObjectProperty} from '@co-hooks/util';
import {INodeType, NodeType} from '@chief-editor/base';
import {MemCache} from '@co-hooks/mem-cache';
import {getRelativeKey, getRelativeKeys} from '../util/keys';
import {FlowBrickGlobal} from './FlowBrick';
import {FlowTemplate} from './FlowTemplate';
import {FlowContext, FlowContextInfo} from './FlowContext';

export interface IModelOptions {

    // 所属上下文
    context: FlowContext;

    // 模型的名字
    name: string;

    // 模型的初始数据
    model?: any;

    // 父模型的名字
    parent?: string;

    // 是否禁用缓存
    disableCache?: boolean;

    // 重置组件时不销毁数据（需要手工销毁）
    keepWhenReset?: boolean;
}

export interface IModelEvents {
    'model-change': [string[], IWatcherFlags];
}

export type FlowModelInfo = Record<string, any>;

/**
 * 数据模型
 *
 */
export class FlowModel extends Emitter<IModelEvents> {

    // 根路径
    public readonly root: DomNode<INodeType>;

    // 模块的名字
    public readonly name: string;

    // 是否禁用缓存
    private readonly disableCache: boolean;

    // 销毁时保留数据
    private readonly keepWhenReset: boolean;

    // 当前模型数据
    private model: FlowModelInfo = {};

    // 当前模型所属上下文
    private readonly context: FlowContext;

    // 当前模块所处的根路径
    private readonly parentModel: FlowModel;

    // 当前模块所用的监控
    private readonly watcher: NestWatcher;

    // 模板缓存
    private readonly templateMap: Record<string, FlowTemplate> = {};

    // 以Id为维度的Brick的缓存
    private readonly brickMap: Record<string, FlowBrickGlobal> = {};

    /**
     * 构造函数
     *
     * @param options 配置信息
     */
    constructor(options: IModelOptions) {

        super();

        const {
            context,
            name,
            model = {},
            parent,
            disableCache = false,
            keepWhenReset = false
        } = options;

        if (/^$(context|scope|model|path|root|input|hooks|data)/.test(name)) {
            throw new Error(name + ' is not a valid model name');
        }

        this.root = new DomNode<INodeType>({type: NodeType.ROOT, cache: new MemCache<unknown>()});

        this.context = context;
        this.parentModel = parent ? context.getModel(parent) : this;
        this.model = model;
        this.watcher = context.getWatcher();
        this.disableCache = disableCache;
        this.keepWhenReset = keepWhenReset;
        this.name = name;

        this.init();
    }

    // region 操作Template
    public getTemplate(id: string): FlowTemplate {
        return this.templateMap[id];
    }

    public unregisterTemplate(creator: string): void {
        delete this.templateMap[creator];
    }

    public registerTemplate(creator: string, template: FlowTemplate): void {
        this.templateMap[creator] = template;
    }

    // endregion 操作Template

    // region 操作非自有属性

    /**
     * 返回当前Model所处的上下文
     *
     */
    public getOwnerContext(): FlowContext {
        return this.context;
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

        if (typeof key === 'string') {
            this.getOwnerContext().setContext(key, value);
        } else {
            this.getOwnerContext().setContext(key);
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
        if (typeof key === 'string') {
            return this.getOwnerContext().getContext(key, isDirect);
        }

        return this.getOwnerContext().getContext(key);
    }

    //
    //     /**
    //      * 打开对话框
    //      *
    //      * @param name 对话框名字
    //      * @param model 打开时的模型数据
    //      * @param isReset 是否重置
    //      */
    //     public openDialog(name: string, model: any = null, isReset: boolean = false): void {
    //         this.getOwnerContext().openDialog(name, model, isReset);
    //     }
    //
    /**
     * 根据Id获取Brick
     *
     * @param id Brick的Id
     * @param  modelName Model名字
     * @return
     */
    public getBrickById(id: string, modelName?: string): FlowBrickGlobal {

        if (modelName) {
            return this.getOwnerContext().getModel(modelName).getBrickById(id);
        }

        const brick = this.brickMap[id];

        if (!brick) {
            throw new Error('component :' + id + ' is not found');
        }

        return brick;
    }

    /**
     * 获取钩子
     *
     */
    public getHooks(): {[key: string]: FunctionAny} {
        return this.getOwnerContext().getHooks();
    }

    /**
     * 获取钩子
     *
     */
    public getHook(key: string): FunctionAny | null {
        return this.getOwnerContext().getHook(key);
    }

    /**
     * 注册一个Watcher
     *
     * @param watchKeys 监控字段
     * @param func 计算函数
     */
    public registerWatcher(watchKeys: string[], func: WatcherFunc): void {
        this.watcher.register(this.name, watchKeys, func);
    }

    // endregion 操作非自有属性

    // region 操作Model相关属性

    /**
     * 返回当前Model所处的根模型
     *
     */
    public getParentModel(count: number = 1): FlowModel {

        let model: FlowModel = this;

        while (count-- > 0) {

            const parent = model.parentModel;

            // 已经到头了
            if (parent === model) {
                break;
            }

            model = parent;
        }

        return model;
    }

    /**
     * 返回当前Model所处的根模型
     *
     */
    public getRootModel(): FlowModel {

        let model: FlowModel = this;

        while (model.getParentModel(1) !== model) {
            model = model.getParentModel(1);
        }

        return model;
    }


    /**
     * 创建一个子数据模型
     *
     * @param name 模型名字
     * @param data 数据
     * @return 返回一个模型
     */
    public createSubModel(name: string, data: any): FlowModel {
        return this.context.createModel({
            name,
            parent: this.name,
            model: data,
            disableCache: this.disableCache,
            keepWhenReset: this.keepWhenReset
        });
    }

    /**
     * 更新model
     *
     * @public
     * @param modelInfo model信息
     * @param isSilent 是否触发事件
     */
    public updateModel(modelInfo: FlowModelInfo, isSilent: boolean = false): void {

        // 同模型不更新
        if (this.model === modelInfo) {
            return;
        }

        this.model = modelInfo;

        if (!isSilent) {
            this.watcher.notify([this.name], {model: true});
        }
    }


    /**
     * 发布模型改动
     *
     * @param keys 要发布的key
     * @param flags 标识位
     */
    public publishModelChange(keys: string[], flags: IWatcherFlags): void {
        this.watcher.notify(keys, flags);
    }

    /**
     * 重置model
     *
     * @public
     * @param modelInfo model对象
     * @param isSilent 是否触发事件
     */
    public resetModel(modelInfo: FlowModelInfo, isSilent: boolean = false): void {
        //
        //         // 清除所有缓存
        //         this.cache.removeCache();
        //
        //         // 清除所有的校验状态
        //         Object.values(this.brickMap).forEach(path => {
        //
        //             // 清除当前的校验信息
        //             path.validateInfo.valid = true;
        //             path.validateInfo.error = '';
        //
        //             if (path.readonly || !path.validateInfo.needValidate) {
        //                 return;
        //             }
        //
        //             this.setValidateByPath(path, {
        //                 state: ValidateState.VALIDATE_RESET,
        //                 error: ''
        //             });
        //         });
        //
        //         // 同模型不更新
        //         if (this.model === modelInfo) {
        //             return;
        //         }
        //
        //         this.model = modelInfo;
        //
        //         if (!isSilent) {
        //             this.publishModelChange([this.name], {reset: true});
        //             this.emit('model-change', [''], {reset: true});
        //         }
    }

    //
    //     // endregion 操作Model相关属性

    // region Brick相关节点操作

    // /**
    //  * 根据路径注册一个Watcher
    //  *
    //  * @param path 路径
    //  * @param {Array} watchKeys 监控字段
    //  * @param {function} func 计算函数
    //  * @param lazy 是否惰性函数
    //  */
    // public registerWatcherByPath(
    //     path: IFlowPathGlobal,
    //     watchKeys: string[],
    //     func: WatcherFunc,
    //     lazy: boolean = false
    // ): void {
    //     this.watcher.register(path.creator, watchKeys, func, lazy);
    // }
    //
    // /**
    //  * 注册路径
    //  *
    //  * @param {Path} path 要注册的路径
    //  */
    // public registerPath(path: IFlowPathGlobal): void {
    //
    //     if (path.id in this.brickMap) {
    //         console.error('duplicate path id:' + path.id);
    //     }
    //     this.brickMap[path.id] = path;
    //     this.registerByNode(path.getNode(), path.validateInfo);
    // }
    //
    // /**
    //  * 注册节点信息
    //  *
    //  * @param node 节点
    //  * @param validateInfo 校验信息
    //  */
    // public registerByNode(node: DomNode<INodeType>, validateInfo: IFlowValidateInfo): void {
    //
    //     const key = node.id;
    //
    //     if (key in this[hashRef]) {
    //         console.error(`duplicate node path :${key}`);
    //     }
    //
    //     this[hashRef][key] = {
    //         data: {
    //             label: '',
    //             values: []
    //         },
    //         validate: {
    //             state: ValidateState.VALIDATE_RESET,
    //             error: ''
    //         },
    //         validateInfo
    //     };
    //
    //     // 注册校验
    //     const pNode = node.parentNode;
    //
    //     if (pNode) {
    //
    //         const index = pNode.getIndex(node);
    //         const pHash = this[hashRef][pNode.id];
    //
    //         if (pHash != null) {
    //             pHash.validateInfo.children.splice(index, 0, validateInfo);
    //         }
    //     }
    // }

    public getWatcher(): NestWatcher {
        return this.watcher;
    }

    /**
     * 通过Brick获取数据
     *
     * @param brick Brick实例
     * @param isDirect 是否直接获取
     * @return 返回获取到的数据
     */
    public getValueByBrick(brick: FlowBrickGlobal, isDirect: boolean = false): any {

        if (brick.readonly) {
            return null;
        }

        const value = getObjectProperty(this.model, getRelativeKeys(brick.getNode()));
        return isDirect ? value : deepClone(value);
    }

    /**
     * 根据Path信息设置值
     *
     * @param brick Brick实例
     * @param value 要设置的值
     * @param manual 是否用户行为
     * @param isSilent 是否静默处理
     */
    public setValueByPath(
        brick: FlowBrickGlobal,
        value: any,
        manual: boolean = false,
        isSilent: boolean = false
    ): void {

        if (brick.readonly) {
            console.error('can\'t set value for readonly brick, set field prop first ', brick);
            return;
        }

        const keys = getRelativeKeys(brick.getNode());
        const success = setObjectProperty(this.model, value, keys);

        if (!success) {
            console.error('can\'t set prop of non object, keys  = ' + keys.join('.'));
            return;
        }

        // if (!this.disableCache) {
        //     // 添加缓存
        //     this.cache.addCache(path.getNode().getAbsoluteKey(), value);
        // }

        if (!isSilent) {
            this.publishModelChange([this.name + '.' + getRelativeKey(brick)], {manual});
        }
    }

    // /**
    //  * 通过Path设置校验
    //  *
    //  * @public
    //  * @param path path对象
    //  * @param info 校验信息
    //  * @param isSilent 是否静默处理
    //  * @return
    //  */
    // public setValidateByPath(path: IFlowPathGlobal, info: IValidateInfo, isSilent: boolean = false): void {
    //
    //     const key = path.getNode().id;
    //
    //     if (!(key in this[hashRef])) {
    //         console.error('set unexist path:' + path.getNode().id);
    //         return;
    //     }
    //
    //     const oldState = this[hashRef][key].validate;
    //
    //     const newState = this[hashRef][key].validate = {
    //         state: info.state,
    //         error: info.error
    //     };
    //
    //     const updated = oldState.state !== newState.state || newState.error;
    //
    //     // 进行一次错误信息的dispatch
    //     let node: OptionalDomNode<IFlowPathGlobal> = path.getNode().parentNode;
    //
    //     const disptachInfo: IValidateResult = {
    //         ...info,
    //         catched: false
    //     };
    //
    //     while (node && node !== this.root) {
    //
    //         const p = node.getValue();
    //
    //         if (p != null) {
    //             (p as any).detectValidateInfo(disptachInfo);
    //         } else {
    //             const conf = this[hashRef][node.id];
    //
    //             const valid = conf.validateInfo.valid = conf.validateInfo.children.every(item => item.valid);
    //
    //             if (valid) {
    //                 conf.validateInfo.error = '';
    //             }
    //         }
    //
    //         node = node.parentNode;
    //     }
    //
    //     if (!isSilent && updated) {
    //         this.emit('model-validate-change', [path.getNode().getAbsoluteKey()]);
    //     }
    //
    //     return;
    // }
    //
    // /**
    //  * 通过path获取校验
    //  *
    //  * @public
    //  * @param {Path} path path对象
    //  * @param isDirect 是否直接获取
    //  * @return {Object}
    //  */
    // public getValidateByPath(path: IFlowPathGlobal, isDirect: boolean = false): IValidateInfo {
    //
    //     if (!path) {
    //         throw new Error('getValidateByPath: path must be defined');
    //     }
    //
    //     const validate = this[hashRef][path.getNode().id].validate;
    //
    //     return isDirect ? validate : deepClone(validate);
    // }
    //
    // /**
    //  * 通过Path设置数据回显
    //  *
    //  * @public
    //  * @param path path对象
    //  * @param data 要设置的数据
    //  * @param isSilent 是否静默处理
    //  */
    // public setDataByPath(path: IFlowPathGlobal, data: any, isSilent: boolean = false): void {
    //
    //     const key = path.getNode().id;
    //
    //     if (!(key in this[hashRef])) {
    //         console.error('set unexist path:' + path.getNode().id);
    //         return;
    //     }
    //
    //     this[hashRef][key].data = data;
    //
    //     if (!isSilent) {
    //         this.emit('model-data-change', [path.getNode().id]);
    //     }
    // }
    //
    // /**
    //  * 通过path获取数据回显
    //  *
    //  * @public
    //  * @param path path对象
    //  * @param isDirect 是否直接获取
    //  * @return
    //  */
    // public getDataByPath(path: IFlowPathGlobal, isDirect: boolean = false): IDataInfo | null {
    //
    //     if (!path) {
    //         console.error('getDataByPath: path must be defined');
    //         return null;
    //     }
    //
    //     if (!this[hashRef][path.getNode().id].data) {
    //         return null;
    //     }
    //
    //     const data = this[hashRef][path.getNode().id].data;
    //
    //     return {
    //         id: path.id,
    //         filed: path.field,
    //         ...(isDirect ? data : deepClone(data))
    //     };
    // }
    //
    // /**
    //  * 设置校验中状态
    //  *
    //  * @public
    //  * @param path path对象
    //  * @return
    //  */
    // public setValidatingByPath(path: IFlowPathGlobal): void {
    //     this[hashRef][path.getNode().id].validate.state = ValidateState.VALIDATING;
    // }
    //
    // /**
    //  * 根据Path信息设置值
    //  *
    //  * @param {Path} path 路径
    //  * @param {boolean} isSilent 是否静默处理
    //  */
    // public resetByPath(path: IFlowPathGlobal, isSilent: boolean = false): void {
    //
    //     if (!path) {
    //         console.error('resetByPath: path must be defined');
    //         return;
    //     }
    //
    //     if (this.keepWhenReset) {
    //         return;
    //     }
    //
    //     const node = path.getNode();
    //
    //     // 先删除数据
    //     if (!path.readonly) {
    //
    //         const scopeNode = node.getScopeNode(1);
    //         const field = node.getField();
    //
    //         if (scopeNode === this.root) {
    //             delete this.model[field];
    //         } else {
    //
    //             const scope = getObjectProperty(this.model, scopeNode.getRelativeKeys());
    //
    //             if (scope != null && typeof scope === 'object') {
    //                 delete (scope as {[key: string]: unknown})[field];
    //             }
    //         }
    //     }
    //
    //     // 清除缓存
    //     const hash = this.brickMap[path.id];
    //
    //     if (hash) {
    //         delete this.brickMap[path.id];
    //     }
    //
    //     this.watcher.unregister(path.creator);
    //
    //     if (!isSilent && !path.readonly) {
    //
    //         this.publishModelChange([this.name + '.' + path.getNode().getAbsoluteKey()], {dispose: true});
    //         this.emit('model-data-change', [path.getNode().getAbsoluteKey()]);
    //         this.emit('model-change', [path.getNode().getAbsoluteKey()]);
    //         this.emit('model-validate-change', [path.getNode().getAbsoluteKey()]);
    //     }
    // }
    //
    // /**
    //  * 根据Path信息设置值
    //  *
    //  * @param  node 节点
    //  */
    // public resetByNode(node: DomNode<INodeType>): void {
    //
    //     // 清理校验
    //     const pNode = node.parentNode;
    //
    //     delete this[hashRef][node.id];
    //
    //     if (pNode) {
    //
    //         const index = pNode.getIndex(node);
    //         const conf = this[hashRef][node.id];
    //
    //         if (conf != null) {
    //             conf.validateInfo.children.splice(index, 1);
    //         }
    //
    //         // 删除节点
    //         pNode.removeChild(node);
    //     }
    // }

    // endregion Brick相关节点操作

    //     /**
    //      * 获取缓存数据
    //      *
    //      * @public
    //      * @param path path对象
    //      * @return
    //      */
    //     public getCache(path: IFlowPathGlobal): any {
    //
    //         if (!path) {
    //             console.error('getCache: path must be defined');
    //             return null;
    //         }
    //
    //         return this.cache.getCache(path.getNode().getAbsoluteKey());
    //     }

    /**
     * 获取model数据
     *
     * @public
     * @param {boolean} isDirect 是否直接获取
     * @return {Object}
     */
    public getModelInfo(isDirect: boolean = false): any {
        return isDirect ? this.model : deepClone(this.model);
    }

    //     /**
    //      * 表单校验
    //      */
    //     public validate(): Promise<boolean> {
    //
    //         let hasInvalid = false;
    //
    //         const promises: Array<Promise<void>> = [];
    //
    //         Object.values(this.brickMap).forEach(path => {
    //
    //             if (path.readonly || !path.validateInfo.needValidate) {
    //                 return;
    //             }
    //
    //             const conf = this[hashRef][path.getNode().id];
    //
    //             // 处理失败的
    //             if (conf.validate.state === ValidateState.VALIDATE_INVALID) {
    //                 hasInvalid = true;
    //                 return;
    //             }
    //
    //             if (conf.validate.state === ValidateState.VALIDATE_RESET
    //                 || conf.validate.state === ValidateState.VALIDATE_PARTIAL
    //                 || conf.validate.state === ValidateState.VALIDATING
    //             ) {
    //                 promises.push(path.validate(ValidateTriggerType.MANUAL));
    //             }
    //         });
    //
    //         if (!promises.length) {
    //             return Promise.resolve(!hasInvalid);
    //         }
    //
    //         // 递归校验
    //         return Promise.all(promises).then(() => this.validate());
    //     }
    //
    /**
     * 销毁当前模型
     *
     */
    public dispose(): void {
        this.watcher.unregister(this.name);
    }

    private init(): void {

        const key = NestWatcher.combineKeys([this.name]);

        this.watcher.register(
            this.name,
            [key],
            (changes: string[], flags: IWatcherFlags) => {

                // update model不应该循环触发
                this.emit('model-change', changes.map(item => item.slice(key.length + 1)), flags);

                return Promise.resolve();
            },
            false
        );
    }
}
