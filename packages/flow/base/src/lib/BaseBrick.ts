/**
 * @file BaseBrickInstance Brick基本业务逻辑
 */

import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {MemCache} from '@co-hooks/mem-cache';
import {FunctionAny, clone, shallowMerge} from '@co-hooks/util';
import {ValidateTriggerType} from '@co-hooks/validate';
import {
    FloatType,
    IBoardConfig,
    IBrick,
    IBrickData,
    IBrickEvent,
    IBrickInstance, ILayoutConfig,
    INodePath,
    INodeType,
    ISetBrickDataPropertyItem,
    ITemplateInstance,
    NodeType
} from '@chief-editor/types';
import {Scheduler} from '../types/Scheduler';

export interface IBaseBrickOptions<V, DS, DP, CG, ST> {
    data: IBrickData<V, DS, DP, CG, ST>;
    scheduler: Scheduler<V, DS, DP, CG, ST>;
    owner: ITemplateInstance;
}

export abstract class BaseBrick<V, DS, DP, CG, ST> extends Emitter<IBrickEvent> implements IBrick<V, DS, DP, CG, ST> {

    public readonly node: DomNode<INodeType>;

    protected readonly owner: ITemplateInstance;

    protected readonly parts: Record<string, DomNode<INodeType>> = {};

    protected readonly scheduler: Scheduler<V, DS, DP, CG, ST>;

    private isDisposed: boolean = false;

    private repeatIndex: number = 0;

    protected constructor(options: IBaseBrickOptions<V, DS, DP, CG, ST>) {

        super();

        const {owner, scheduler, data} = options;

        this.owner = owner;
        this.scheduler = scheduler;

        // 初始化的时候更新调度器
        const base = this.scheduler.initBrickData(this, data);

        this.node = new DomNode<INodeType>({
            type: NodeType.BRICK,
            brickId: base.id,
            brickType: base.brickType,
            field: base.field,
            virtual: base.virtual
        });

        this.updateBrickInstance(base, true);
    }

    public init(): void {

        // 首先初始化一份静态信息
        this.scheduler.initStaticBrickData && this.scheduler.initStaticBrickData();

        // 第一次初始化Part
        this.updateBrickParts();

        // 执行真正的Init过程
        this.scheduler.init && this.scheduler.init();
    }

    public getInstance(): Readonly<IBrickInstance<V, DS, DP, CG, ST>> {

        return {
            id: this.id,
            creator: this.id,
            label: this.label,
            field: this.field,
            virtual: this.virtual,
            env: this.env,
            readonly: this.readonly,
            value: this.value,
            datasource: this.datasource,
            staticDatasource: this.staticDatasource,
            display: this.display,
            config: this.config,
            styles: this.styles,
            validateInfo: this.validateInfo,
            validating: this.validating,
            manual: this.manual,
            ready: this.ready,
            loading: this.loading,
            brickType: this.brickType,
            layout: this.layout,
            state: this.state,
            lock: false
        };
    }

    public getPart(name: string): DomNode<INodeType> | null {
        return this.parts[name] || null;
    }

    public getNode(): DomNode<INodeType> {
        return this.node;
    }

    public getNodePath(): INodePath[] {

        const res: INodePath[] = [{
            type: NodeType.BRICK,
            id: this.id
        }];

        let parent = this.node.parentNode;

        while (parent) {

            const nodeValue = parent.getValue();

            res.unshift({
                type: nodeValue.type,
                id: nodeValue.type === NodeType.STREAM || nodeValue.type === NodeType.LAYER
                    ? nodeValue.boardId
                    : nodeValue.type === NodeType.BRICK
                        ? nodeValue.brickId
                        : ''
            });

            parent = parent.parentNode;
        }

        return res;
    }

    public getNodeIndex(): number {

        const parent = this.node.parentNode;

        if (parent) {
            return parent.getIndex(this.node);
        }

        return -1;
    }

    public getBoardType(): NodeType.STREAM | NodeType.LAYER {

        const node = this.node.parentNode;

        if (node == null) {
            return NodeType.STREAM;
        }

        const board = this.owner.getBoardByNode(node);

        return board.type;
    }

    public isFloat(): boolean {

        const node = this.node.parentNode;

        if (node == null) {
            return false;
        }

        const board = this.owner.getBoardByNode(node);

        return board.type === NodeType.STREAM && board.floatType !== FloatType.NONE;
    }

    public refreshBrick(): void {
        this.emit('repaint');
    }

    public getBrickData(
        cleanBrickId: boolean = false,
        cleanPartBricks: boolean = false
    ): IBrickData<V, DS, DP, CG, ST> {

        const data = clone(this.scheduler.getBrickData());
        const template = this.owner;

        if (cleanBrickId) {
            delete data.id;
        }

        if (!Object.keys(this.parts).length) {
            return data;
        }

        const parts: Record<string, IBoardConfig> = {};

        Object.keys(this.parts).forEach(key => {
            const {bricks, ...extra} = template.getBoardByNode(this.parts[key]).getBoardData(cleanBrickId);
            parts[key] = {
                bricks: cleanPartBricks ? [] : bricks,
                ...extra
            };
        });

        return {
            ...data,
            parts
        };
    }

    public getDatasource(data: unknown): void {
        this.scheduler.getDatasource && this.scheduler.getDatasource(data);
    }

    public dispatchEvent(e: Event): void;

    public dispatchEvent(name: string, param?: any): void;

    public dispatchEvent(e: Event | string, param?: any): void {
        this.scheduler.dispatchEvent && this.scheduler.dispatchEvent(e, param);
    }

    public setValue(value: V, manual?: boolean, isSilent?: boolean): void {
        this.scheduler.setValue && this.scheduler.setValue(value, manual, isSilent);
    }

    public setState(state: Partial<ST>): void {
        this.scheduler.setState && this.scheduler.setState(state);
    }

    public validate(type: ValidateTriggerType = 'reset'): void {
        this.scheduler.validate && this.scheduler.validate(type);
    }

    public getData(): Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'> {
        return this.scheduler.getBrickData();
    }

    public setData(data: IBrickData<V, DS, DP, CG, ST>): void {
        this.scheduler.updateBrickData && this.scheduler.updateBrickData(data);
    }

    public setBrickDataProperties(properties: ISetBrickDataPropertyItem[]): boolean {

        if (properties.length === 0) {
            return true;
        }

        return this.scheduler.setBrickDataProperties ? this.scheduler.setBrickDataProperties(properties) : false;
    }

    public setBrickLayout(layout: ILayoutConfig): void {
        return this.scheduler.setBrickLayout && this.scheduler.setBrickLayout(layout);
    }

    public getHook(name: string): FunctionAny | null {
        return this.scheduler.getHook ? this.scheduler.getHook(name) : null;
    }

    public getByExpression(...expression: Array<string | number>): any {
        return this.scheduler.getByExpression ? this.scheduler.getByExpression(...expression) : null;
    }

    public getBuildInHooks(): Record<string, FunctionAny> {
        return this.scheduler.getBuildInHooks ? this.scheduler.getBuildInHooks() : {};
    }

    public updateBrickInstance(instance: Partial<IBrickInstance<V, DS, DP, CG, ST>>, isSilent?: boolean): void {

        Object.assign(this, shallowMerge({}, instance));

        if (!isSilent) {
            if (this.scheduler.isPartDynamic()) {
                this.updateBrickParts();
            }

            this.refreshBrick();
        }
    }

    public setLock(lock: boolean, isSilent?: boolean): void {
        if (this.lock === lock) {
            return;
        }

        this.updateBrickInstance({lock}, true);

        if (!isSilent) {
            this.emit('lock-change', lock);
        }
    }

    public getLock(): boolean {
        return this.lock || false;
    }

    public dispose(): void {

        // 处理一下死循环的问题
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;
        this.scheduler.dispose && this.scheduler.dispose();
        Object.keys(this.parts).forEach(key => this.disposePartBoard(key));
        this.owner.disposeNode(this.node);
    }

    protected createPartBoard(
        part: string,
        config: IBoardConfig,
        repeat: boolean,
        field?: string,
        onCreated?: (node: DomNode<INodeType>) => void
    ): DomNode<INodeType> {
        let vnode;

        this.owner.createBoard({...config, id: `${this.id}_${part}`}, node => {
            if (repeat) {

                vnode = new DomNode<INodeType>({
                    type: NodeType.REPEAT,
                    field: String(this.repeatIndex++),
                    cache: new MemCache<unknown>()
                });

                vnode.appendChild(node);

                this.parts[part] = vnode;
            } else if (field == null) {
                this.parts[part] = node;
                vnode = node;
            } else {
                vnode = new DomNode<INodeType>({
                    type: NodeType.VIRTUAL,
                    field
                });

                vnode.appendChild(node);

                this.parts[part] = vnode;
            }


            onCreated && onCreated(vnode);
        });

        return vnode as unknown as DomNode<INodeType>;
    }

    protected disposePartBoard(part: string): void {
        if (this.parts[part] != null) {
            this.owner.disposeNode(this.parts[part]);
            delete this.parts[part];
        }
    }

    protected updateBrickParts(): void {

        const newPartList = this.scheduler.getPartList();
        const container = this.virtual ? this.node.parentNode || this.node : this.node;
        const oldList = container.getChildNodes().slice(this.virtual ? 1 : 0);
        const len = oldList.length;
        const usedKeys: Record<string, boolean> = {};

        const insertNode = (node: DomNode<INodeType>, idx: number): void => {
            if (idx >= len) {
                container.appendChild(node);
            } else if (node !== oldList[idx]) {
                container.insertBefore(node, oldList[idx]);
            }
        };

        newPartList.forEach(({key, repeat, field, ...config}, i) => {
            usedKeys[key] = true;

            this.parts[key]
                ? insertNode(this.parts[key], i)
                : this.createPartBoard(key, config, repeat, undefined, node => insertNode(node, i));

        });

        Object.keys(this.parts).forEach(key => {
            if (!usedKeys[key]) {
                this.disposePartBoard(key);
            }
        });
    }
}

export interface BaseBrick<V, DS, DP, CG, ST> extends IBrickInstance<V, DS, DP, CG, ST>, Emitter<IBrickEvent> {
}

export type BaseBrickGlobal = BaseBrick<any, any, any, any, any>;
