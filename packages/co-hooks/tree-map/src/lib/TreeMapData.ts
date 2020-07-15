/**
 * @file TreeMapData 级联核心数据处理
 */

import {getUniqueKey} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';

export interface ITreeMapData<D> {

    type?: string;

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

    // 是否展开到叶子节点
    spread?: boolean;

    // 子项
    children?: D[];
}

export interface ITreeMapHashItem<T, D> {
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
    search: string;
    nodePath: string[];
    children: Array<ITreeMapHashItem<T, D>>;

    item: D;
}

export type GetValueFromDataFunc<D, T> = (datasource: D) => T;

export type GetLabelFromData<D> = (datasource: D) => string;

export interface ITreeMapDataOptions<T, D extends ITreeMapData<D>> {
    // 数据源
    datasource: D[];

    // 是否禁用
    disabled?: boolean;

    // 是否只读
    readonly?: boolean;

    // 当前元素的子元素是否可以全选
    showAll?: boolean;

    // 是否支持多选
    multiple?: boolean;

    spread?: boolean;

    // 关联关系 值之间是否有联系
    association?: boolean;
}

export interface ITreeMapDataEvent {
    'reset': [];
    'need-update-value': [];
}

export enum NOT_OPTION {
    ROOT = 'root',
    UNKNOWN = 'unknown'
}


export class TreeMapData<T, D extends ITreeMapData<D>> extends Emitter<ITreeMapDataEvent> {

    // 是否多选
    public multiple: boolean = false;

    // 是否禁用
    public disabled: boolean = false;

    // 是否只读
    public readonly: boolean = false;

    // 是否显示全选
    public showAll: boolean = false;

    public spread: boolean = false;

    public association: boolean = true;

    // 数据缓存
    protected hashMap: {[key: string]: ITreeMapHashItem<T, D>} = {};

    // 数据缓存
    protected renderList: Array<ITreeMapHashItem<T, D>> = [];

    // 根节点Id
    protected root: string = '';

    // 数据源
    protected datasource: D[] = [];

    private idMap: {[key: string]: T | NOT_OPTION} = {};

    private readonly getValueFromData: GetValueFromDataFunc<D, T>;

    private readonly getLabelFromData: GetLabelFromData<D>;

    constructor(
        getValueFromData: GetValueFromDataFunc<D, T>,
        getLabelFromData: GetLabelFromData<D>
    ) {
        super();

        this.getValueFromData = getValueFromData;
        this.getLabelFromData = getLabelFromData;
    }

    /**
     * 销毁组件
     *
     */
    public dispose(): void {
        this.datasource = [];
        this.hashMap = {};
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
    public getItemInfo(id: string): ITreeMapHashItem<T, D> {
        return this.hashMap[id];
    }

    public getHashMap(): {[key: string]: ITreeMapHashItem<T, D>} {
        return this.hashMap;
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

    /**
     * 更新组件配置
     *
     * @param options 配置
     */
    public updateTreeMapDataOptions(options: ITreeMapDataOptions<T, D>): [boolean, boolean] {

        const [needUpdateDatasource, needUpdateValue] = this.needUpdate(options);

        if (needUpdateDatasource) {

            this.hashMap = {};
            this.idMap = {};
            this.renderList = [];

            // 因为root元素不会产生任何渲染，所以这地方不传递P了
            const root = this.createDataHashMap({
                label: '',
                value: '',
                children: this.datasource
            } as unknown as D);

            this.emit('reset');

            this.root = root.id;
            this.idMap[this.root] = NOT_OPTION.ROOT;
        }

        return [needUpdateDatasource, needUpdateValue];
    }

    public createDataHashMap(
        data: D,
        parentId: string | null = null,
        level: number = 0
    ): ITreeMapHashItem<T, D> {

        const {
            disabled,
            readonly,
            showAll,
            selectable,
            needLoad,
            children,
            type = 'option',
            ...others
        } = data;

        const value = this.getValueFromData(data);
        const label = this.getLabelFromData(data);
        const isLeaf = (!children || !children.length) && !needLoad;

        let realValue: T | NOT_OPTION;

        if (value == null || parentId == null) {

            if (parentId != null) {
                if (type === 'option') {
                    console.error(new Error(label + 'is a value type without value'));
                } else if (!isLeaf && !this.spread && selectable) {
                    console.error(new Error(label + 'has children without value'));
                }
            }

            realValue = NOT_OPTION.UNKNOWN;
        } else {
            realValue = value;
        }

        const id = realValue === NOT_OPTION.UNKNOWN ? getUniqueKey(data) : getUniqueKey(realValue);

        if (this.idMap[id]) {
            throw new Error(`value=${value} is not unique`);
        }

        this.idMap[id] = realValue;

        const map: ITreeMapHashItem<T, D> = this.hashMap[id] = {
            ...others,
            id,
            parentId,
            value: realValue as T,
            values: [realValue as T],
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
            search: '',
            nodePath: [id],
            children: [],
            item: data
        };

        // 处理根节点
        if (!parentId) {
            map.disabled = this.disabled;
            map.readonly = this.readonly;
            map.showAll = this.multiple && this.showAll;
            map.values = [];
        } else {

            const parent = this.hashMap[parentId];

            map.disabled = disabled || (this.association && parent.disabled);
            map.readonly = readonly || parent.readonly;
            map.selectable = isLeaf ? true : selectable != null ? selectable : this.multiple;
            map.needLoad = needLoad || false;
            map.search = parent.search ? parent.search + '/' + label : label;
            map.nodePath = parent.nodePath.concat(map.nodePath);
            map.showAll = showAll == null ? parent.showAll : this.multiple && showAll;
            map.values = parent.values.concat(map.values);
        }

        if (parentId != null) {
            this.renderList.push(map);
        }

        if (children && children.length) {

            level++;
            map.children = children.map(child => this.createDataHashMap(child, id, level));

            if (!map.disabled && !isLeaf && this.association) {
                map.disabled = map.children.every(child => child.disabled);
            }

            if (!map.readonly && !isLeaf) {
                map.readonly = map.children.every(child => child.readonly);
            }
        }

        return map;
    }

    /**
     * 通过value获取id
     *
     * @param value
     * @return
     */
    public getIdByValue(value: T): string {
        return getUniqueKey(value);
    }

    /**
     * 通过value获取id
     *
     * @param values
     */
    public getIdsByValues(values: T[]): string[] {

        const ids: string[] = [];

        values.forEach((item: T) => {
            ids.push(this.getIdByValue(item));
        });

        return ids;
    }

    public getRenderList(): Array<ITreeMapHashItem<T, D>> {
        return this.renderList;
    }

    private needUpdate(options: ITreeMapDataOptions<T, D>): [boolean, boolean] {

        const {
            datasource = [],
            disabled = false,
            readonly = false,
            multiple = false,
            showAll = false,
            association = true,
            spread = false
        } = options;

        const needUpdateDatasource = !this.root
            || this.datasource !== datasource
            || this.disabled !== disabled
            || this.readonly !== readonly
            || this.multiple !== multiple
            || this.showAll !== showAll;

        const needUpdateValue = this.spread !== spread || needUpdateDatasource;

        this.showAll = showAll;
        this.datasource = datasource;
        this.disabled = disabled;
        this.readonly = readonly;
        this.multiple = multiple;
        this.association = association;
        this.spread = spread;

        return [needUpdateDatasource, needUpdateValue];
    }
}
