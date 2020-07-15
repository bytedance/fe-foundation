/**
 * @file CascaderCore 级联核心数据处理
 */

import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';

export enum CascaderState {
    // 没选中
    UNSELECTED = 0,
    // 部分选中
    PARTIAL = 1,
    // 选中
    SELECTED = 2
}

export interface ICascaderDatasource<T, P> {

    // 当前数据项的值
    value: T;

    type?: string;

    // 当前数据项的名字
    label: string;

    // 是否禁用
    disabled?: boolean;

    // 是否只读
    readonly?: boolean;

    // 是否异步拉取children数据
    needLoad?: boolean;

    // 是否可以选择
    selectable?: boolean;

    // 当前元素的子元素是否可以全选
    showAll?: boolean;

    // 子数据项
    children?: Array<ICascaderDatasource<T, P>>;

    // 可以配置额外信息
    extra?: P;
}

export type ICascaderLoad<T, P>
    = (item: IHashMapItem<T, P>) => Promise<Array<ICascaderDatasource<T, P>>>;

export type renderColumnTitles<T, P> = (info: IHashMapItem<T, P>) => string | null;
export type IColumnTitles<T, P> = string[] | renderColumnTitles<T, P>;

export interface ICascaderCoreOption<T, P> {
    columnTitles?: IColumnTitles<T, P>;

    // 数据源
    datasource: Array<ICascaderDatasource<T, P>>;

    // 是否禁用
    disabled?: boolean;

    // 是否只读
    readonly?: boolean;

    // 当前元素的子元素是否可以全选
    showAll?: boolean;

    // 是否支持多选
    multiple?: boolean;

    // 是否展开到叶子节点
    spread?: boolean;

    // 异步加载函数，没传递的话，会什么都不做
    load?: ICascaderLoad<T, P>;

    value: T[];

    expandedIds?: T[];

    defaultExpandedIds?: T[];

    accordion?: boolean; // 手风琴模式

    partialCheckAble?: boolean; // 是否支持半选，为 false 时父节点和子节点不再有逻辑上的绑定

    selectToExpand?: boolean; // 选中时是否展开
}

export interface IHashMapItem<T, P> {
    id: string;
    parentId: string | null;
    isLeaf: boolean;
    needLoad: boolean;
    loading: boolean;
    selectable: boolean;
    readonly: boolean;
    disabled: boolean;
    showAll: boolean;
    level: number;
    type: string;
    value: T;
    values: T[];
    label: string;
    state: CascaderState;
    search: string;
    nodePath: string[];
    children: Array<IHashMapItem<T, P>>;
    extra?: P;
}

export interface IValueMap {
    id: string;
    map: {[key: string]: IValueMap};
}

export interface IGroupDisplayInfoItem<T, P> {
    list: Array<IHashMapItem<T, P>>;
    level: number;
}

export interface ICascaderCoreEvent<T> {
    'value-change': [];
    'change': [T[]];
    'query-change': [string[]];
    'reset': [];
}

export interface ICascader<T, P> {
    multiple: boolean;

    dispose(): void;

    getRootId(): string;

    getItemInfo(id: string): IHashMapItem<T, P>;

    setItemState(id: string, newState?: CascaderState): void;

    resetState(): void;

    setQuery(query: string): void;

    getQueries(): string[];

    getDisplayInfo(): Array<IHashMapItem<T, P>>;

    getGroupDisplayInfo(): Array<IGroupDisplayInfoItem<T, P>>;
}

export class CascaderCore<T, P, E extends ICascaderCoreEvent<T>>
    extends Emitter<E> implements ICascader<T, P> {

    // 是否多选
    public multiple: boolean = false;

    // 级联组件的值
    protected value: T[] = [];

    // 打平模式（仅输出最后一级）
    protected spread: boolean = false;

    // 是否禁用
    protected disabled: boolean = false;

    // 是否只读
    protected readonly: boolean = false;

    // 是否显示全选
    protected showAll: boolean = false;

    // 数据缓存
    protected hashMap: {[key: string]: IHashMapItem<T, P>} = {};

    // 值映射id的缓存
    protected valueHash: {[key: string]: string} = {};

    // 值映射id的缓存
    protected valueMap: {[key: string]: IValueMap} = {};

    // 根节点Id
    protected root: string = '';

    // 数据源
    protected datasource: Array<ICascaderDatasource<T, P>> = [];

    // 当前搜索出来的Id数组
    protected queries: string[] = [];

    //
    protected columnTitles: IColumnTitles<T, P> = [];

    protected accordion: boolean = true;

    protected partialCheckAble: boolean = true;

    protected selectToExpand: boolean = true;

    /**
     * 销毁组件
     *
     */
    public dispose(): void {
        this.datasource = [];
        this.hashMap = {};
        this.valueHash = {};
        this.valueMap = {};
        this.queries = [];
        this.removeAllListeners('change');
        this.removeAllListeners('value-change');
    }

    /**
     * 获取根节点Id
     */
    public getRootId(): string {
        return this.root;
    }

    /**
     * 根据id获取渲染信息
     *
     * @param {string} id 编号
     * @return {Object}
     */
    public getItemInfo(id: string): IHashMapItem<T, P> {
        return this.hashMap[id];
    }

    /**
     * 更改当前选中id
     *
     * @param id 编号
     * @param newState 新状态，多选时有效
     */
    public setItemState(id: string, newState?: CascaderState): void {

        if (this.hashMap[id].disabled || this.hashMap[id].readonly) {
            return;
        }

        if (this.multiple) {

            const state = this.hashMap[id].state;

            newState = newState == null
                ? state === CascaderState.SELECTED
                    ? CascaderState.UNSELECTED
                    : CascaderState.SELECTED
                : newState;

            this.updateSelectedState(id, newState);
        } else {
            this.resetHashState();
            this.updateSelectedState(id, CascaderState.SELECTED);
        }

        this.emit('value-change');
        this.emit('change', this.value = this.getValueFromSelected());
    }

    /**
     * 重置状态
     */
    public resetState(): void {
        this.resetHashState();
        this.emit('value-change');
        this.emit('change', this.value = this.getValueFromSelected());
    }

    /**
     * 设置搜索关键词
     *
     * @param query 关键词
     */
    public setQuery(query: string): void {

        this.queries = Object
            .keys(this.hashMap)
            .filter(key => this.hashMap[key].search.indexOf(query) >= 0);

        this.emit('query-change', this.queries);
    }

    /**
     * 设置搜索关键词
     */
    public getQueries(): string[] {
        return this.queries;
    }

    /**
     * 获取展示信息
     */
    public getDisplayInfo(): Array<IHashMapItem<T, P>> {
        return this.getIdFromSelected().map(item => this.hashMap[item]);
    }

    /**
     * 按层级获取展示信息
     */
    public getGroupDisplayInfo(): Array<IGroupDisplayInfoItem<T, P>> {

        const result = this.getIdFromSelected().map(item => this.hashMap[item]);
        const map: Array<Array<IHashMapItem<T, P>>> = [];

        result.forEach(item => {
            map[item.nodePath.length - 1] = map[item.nodePath.length - 1] || [];
            map[item.nodePath.length - 1].push(item);
        });

        const ret: Array<IGroupDisplayInfoItem<T, P>> = [];

        for (let i = 0; i < map.length; i++) {

            if (map[i]) {
                ret.push({
                    level: i - 1,
                    list: map[i]
                });
            }
        }

        return ret;
    }


    public getDescendants(ancestorId: string): string[] {
        const ancestor = this.getItemInfo(ancestorId);
        let descendants: string[] = [];

        ancestor.children.forEach(child => {
            descendants.push(child.id);
            descendants = descendants.concat(this.getDescendants(child.id));
        });

        return descendants;
    }

    public isAncestor(ancestorId: string, descendantId: string): boolean {
        const descendant = this.getItemInfo(descendantId);

        return descendant.nodePath.indexOf(ancestorId) > -1;
    }

    /**
     * 更改当前选中id
     *
     * @param ids 编号数组
     * @param newState 新状态，多选时有效
     */
    protected setQueryState(ids: string[], newState?: CascaderState): [Array<IHashMapItem<T, P>>, CascaderState] {
        let queries: Array<IHashMapItem<T, P>> = this.queries
            .map(item => this.getItemInfo(item));

        const checked = queries.every(item => item.state === CascaderState.SELECTED);
        const state = newState == null
            ? checked ? CascaderState.UNSELECTED : CascaderState.SELECTED
            : newState;

        queries = queries.filter(item => !item.disabled && item.state !== state);

        if (!queries.length) {
            return [queries, state];
        }

        queries.forEach((item: IHashMapItem<T, P>) => this.updateSelectedState(item.id, state));

        this.emit('value-change');
        this.emit('change', this.value = this.getValueFromSelected());

        return [queries, state];
    }

    /**
     * 更新组件配置
     *
     * @param options 配置
     */
    protected updateCascaderOptions(
        options: ICascaderCoreOption<T, P>
    ): {needUpdateDatasource: boolean; needUpdateValue: boolean} {

        const [needUpdateDatasource, needUpdateValue] = this.needUpdate(options);

        if (needUpdateDatasource) {

            this.hashMap = {};
            this.valueHash = {};
            this.valueMap = {};
            this.queries = [];

            // 因为root元素不会产生任何渲染，所以这地方不传递P了
            const root = this.createDataHashMap({
                label: '',
                value: '',
                children: this.datasource
            } as any);

            this.emit('reset');

            this.root = root.id;
        }

        if (needUpdateValue) {

            // 增加一个变量少一次遍历
            this.setValueToSelected(options.value, needUpdateDatasource);

            this.emit('value-change');

            // if (options.value !== this.value) {
            //     this.emit('change', this.value);
            // }
        }

        return {needUpdateDatasource, needUpdateValue};
    }

    // 加载数据源函数
    protected load: ICascaderLoad<T, P> = () => Promise.resolve([]);

    protected setHashState(id: string, state: CascaderState, deep: boolean = false): void {

        if (deep && state === CascaderState.PARTIAL) {
            throw new Error('cant setStateAll partial');
        }

        const node = this.hashMap[id];

        if (!node) {
            throw new Error('cant setState for an inexistence item');
        }

        if (node.state === state) {
            return;
        }

        node.state = state;

        if (!deep || !node.children || !node.children.length) {
            return;
        }

        node.children.forEach((item: IHashMapItem<T, P>) => this.setHashState(item.id, state, deep));
    }

    protected needUpdate(options: ICascaderCoreOption<T, P>): [boolean, boolean] {

        const {
            columnTitles = [],
            value = [],
            datasource = [],
            disabled = false,
            readonly = false,
            multiple = false,
            spread = false,
            showAll = false,
            accordion = true,
            partialCheckAble = true,
            selectToExpand = true,
            load = () => Promise.resolve([])
        } = options;

        const needUpdateDatasource = !this.root
            || this.datasource !== datasource
            || this.disabled !== disabled
            || this.readonly !== readonly
            || this.multiple !== multiple
            || this.showAll !== showAll;

        const needUpdateValue = needUpdateDatasource
            || this.value !== value
            || this.spread !== spread;

        this.value = value;
        this.showAll = showAll;
        this.datasource = datasource;
        this.disabled = disabled;
        this.readonly = readonly;
        this.spread = spread;
        this.multiple = multiple;
        this.load = load;
        this.columnTitles = columnTitles;
        this.accordion = accordion;
        this.partialCheckAble = partialCheckAble;
        this.selectToExpand = selectToExpand;

        return [needUpdateDatasource, needUpdateValue];
    }

    protected createDataHashMap(
        data: ICascaderDatasource<T, P>,
        parentId: string | null = null,
        level: number = 0
    ): IHashMapItem<T, P> {

        const {
            value,
            label,
            disabled,
            readonly,
            showAll,
            selectable,
            needLoad,
            children,
            extra,
            type = 'option',
            ...others
        } = data;

        const isLeaf = (!children || !children.length) && !needLoad;
        const id = guid();
        let realValue: T;

        if (value == null) {

            if (type === 'option') {
                console.error(new Error(label + 'is a value type without value'));
            } else if (!isLeaf && !this.spread && selectable) {
                console.error(new Error(label + 'has children without value'));
            }

            realValue = '' as any;
        } else {
            realValue = value;
        }

        const map: IHashMapItem<T, P> = this.hashMap[id] = {
            ...others,
            id,
            parentId,
            value: realValue,
            values: [realValue],
            label,
            level,
            isLeaf,
            type,
            disabled: false,
            readonly: false,
            showAll: false,
            selectable: false,
            needLoad: false,
            loading: false,
            state: CascaderState.UNSELECTED,
            extra,
            search: '',
            nodePath: [id],
            children: []
        };

        // 处理根节点
        if (!parentId) {
            map.disabled = this.disabled;
            map.readonly = this.readonly;
            map.showAll = this.multiple && this.showAll;
            map.values = [];
        } else {

            const parent = this.hashMap[parentId];

            map.disabled = disabled || (this.partialCheckAble && parent.disabled);
            map.readonly = readonly || parent.readonly;
            map.selectable = isLeaf ? true : selectable != null ? selectable : this.multiple;
            map.needLoad = needLoad || false;
            map.search = parent.search ? parent.search + '/' + label : label;
            map.nodePath = parent.nodePath.concat(map.nodePath);
            map.showAll = showAll == null ? parent.showAll : this.multiple && showAll;
            map.values = parent.values.concat(map.values);

            // 生成当前值列表
            let valueMap = this.valueMap;
            let index = 0;

            while (index < parent.values.length) {
                valueMap = valueMap[String(parent.values[index++])].map;
            }

            valueMap[String(value)] = {
                id,
                map: {}
            };

            this.valueHash[String(value)] = id;
        }

        if (children && children.length) {
            level++;
            map.children = children.map(child => this.createDataHashMap(child, id, level));

            if (!map.disabled && !isLeaf && this.partialCheckAble) {
                map.disabled = map.children.every(child => child.disabled);
            }

            if (!map.readonly && !isLeaf) {
                map.readonly = map.children.every(child => child.readonly);
            }
        }

        return map;
    }

    protected resetHashState(): void {
        Object.values(this.hashMap).forEach(item => item.state = CascaderState.UNSELECTED);
    }

    protected updateSelectedState(id: string, state: CascaderState): void {

        if (state === CascaderState.PARTIAL) {
            throw new Error('`state` could not be CHECKBOX_STATE_PARTIAL');
        }

        const pathNodes: Array<IHashMapItem<T, P>> = this.hashMap[id].nodePath.map(
            item => this.hashMap[item]
        );

        if (!pathNodes.length) {
            return;
        }

        let current: IHashMapItem<T, P> | null = pathNodes.pop() || null;

        if (!current || state === current.state) {
            return;
        }

        this.setHashState(current.id, state, !current.isLeaf && this.partialCheckAble && this.multiple);

        if (!this.partialCheckAble || !this.multiple) {
            return;
        }

        while (pathNodes.length) {

            current = pathNodes.pop() || null;

            if (!current) {
                return;
            }

            const children = current.children || [];
            const length = children.length;
            let selected = 0;
            let unselected = 0;

            children.forEach(child => {
                const {state: childState} = child;
                if (childState === CascaderState.SELECTED) {
                    selected++;
                } else if (childState === CascaderState.UNSELECTED) {
                    unselected++;
                }
            });

            if (unselected === length) {
                this.setHashState(current.id, CascaderState.UNSELECTED, false);
            } else if (selected === length) {
                this.setHashState(current.id, CascaderState.SELECTED, false);
            } else {
                this.setHashState(current.id, CascaderState.PARTIAL, false);
            }
        }
    }

    protected getIdFromSelected(): string[] {

        const {multiple, spread} = this;

        const result = Object.keys(this.hashMap).filter(key => {

            const {
                state,
                nodePath,
                isLeaf,
                selectable
            } = this.hashMap[key];

            if (state !== CascaderState.SELECTED) {
                return;
            }

            if (!this.partialCheckAble) { // 非全选模式返回全部选中节点
                return true;
            }

            // 展开的情况下，只要叶子节点
            if (spread) {
                return isLeaf && selectable;
            }

            // 不然只有当父亲元素没有被选中的时候，才显示
            for (let i = 1; i < nodePath.length - 1; i++) {
                if (this.hashMap[nodePath[i]].state === CascaderState.SELECTED
                    && this.hashMap[nodePath[i]].selectable
                ) {
                    return false;
                }
            }

            // 过滤了根节点
            return nodePath.length > 1;
        });

        if (!multiple && result.length > 1) {
            console.error('cascader has multiple value, but is not multiple');
        }

        return result;
    }

    protected getValueFromSelected(): T[] {

        const result = this.getIdFromSelected();

        return result.map(item => this.hashMap[item].value);
    }

    protected setValueToSelected(value: T[], notReset: boolean = false): void {

        if (!this.multiple && value.length > 1) {
            throw new Error('cascader is not multiple but has more than one value');
        }

        if (!notReset) {
            this.resetHashState();
        }

        if (!value.length) {
            this.value = [];
            return;
        }

        let unvalid = false;

        value.forEach((item: T) => {

            const id = this.getIdByValue(item);

            // 找不到说明值有非法的
            if (!this.hashMap[id]) {
                unvalid = true;
                return;
            }

            if (this.spread && this.hashMap[id].children && this.hashMap[id].children.length) {
                unvalid = true;
                return;
            }

            this.updateSelectedState(id, CascaderState.SELECTED);
        });

        if (unvalid) {
            value = this.getValueFromSelected();
        }

        this.value = value;
    }

    /**
     * 通过value获取id
     *
     * @param value
     * @return
     */
    protected getIdByValue(value: T): string {
        return this.valueHash[String(value)];
    }

    /**
     * 通过value获取id
     *
     * @param values
     */
    protected getIdsByValues(values: T[]): string[] {

        const ids: string[] = [];

        values.forEach((item: T) => {

            ids.push(this.getIdByValue(item));
        });

        return ids;
    }

}
