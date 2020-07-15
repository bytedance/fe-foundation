/**
 * @file Cascader
 */

import {isFunction} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {
    ITreeMapData,
    ITreeMapDataOptions,
    ITreeMapHashItem,
    TreeMapData,
    TreeMapState,
    TreeMapValue
} from '@co-hooks/tree-map';

export type renderColumnTitles<T> = (info: ITreeMapHashItem<T, ICascaderData<T>>) => string | null;
export type IColumnTitles<T> = string[] | renderColumnTitles<T>;

export type ICascaderLoad<T> = (item: ITreeMapHashItem<T, ICascaderData<T>>) => Promise<ICascaderData<T>[]>;

export type ICascaderSearch<T> = (query: string, data: ITreeMapHashItem<T, ICascaderData<T>>) => boolean;

export interface IGroupDisplayInfoItem<T> {
    list: Array<ITreeMapHashItem<T, ICascaderData<T>>>;
    level: number;
}

export interface ICascaderData<T> extends ITreeMapData<ICascaderData<T>> {
    label: string;
    value: T;
}

export interface ICascaderHashItem<T> extends ITreeMapHashItem<T, ICascaderData<T>> {
    state: TreeMapState;
}

export interface ICascaderOptions<T> extends ITreeMapDataOptions<T, ICascaderData<T>> {
    columnTitles?: IColumnTitles<T>;

    // 异步加载函数，没传递的话，会什么都不做
    load?: ICascaderLoad<T>;

    // 自定义搜索
    search?: ICascaderSearch<T>;

    value: T[];

    // 是否支持半选
    particalCheck?: boolean;

    // 列宽，默认200
    columnWidth?: number;
    rowHeight?: number;
    onChange?: (value: T[], info: Array<ITreeMapHashItem<T, ICascaderData<T>>>) => void;
}

export interface ICascaderEvent<T> {
    'reset': [];
    'data-loading': [string];
    'value-change': [];
    'change': [T[], Array<ITreeMapHashItem<T, ICascaderData<T>>>];
    'active-change': [];
    'query-change': [string[]];
    'active-id-change': [string];
}

export class Cascader<T> extends Emitter<ICascaderEvent<T>> {

    // 列宽
    public columnWidth: number = 200;
    public rowHeight: number = 200;

    public query: string = '';

    // 当前激活元素
    private activeId: string = '';

    // 当前搜索出来的Id数组
    private queries: string[] = [];

    private columnTitles: IColumnTitles<T> = [];

    private readonly treeMapData: TreeMapData<T, ICascaderData<T>>;

    private readonly treeMapValue: TreeMapValue<T, ICascaderData<T>>;

    constructor() {
        super();

        this.treeMapData = new TreeMapData<T, ICascaderData<T>>(this.getValueFromData, this.getLabelFromData);
        this.treeMapValue = new TreeMapValue(this.treeMapData);

        this.init();
    }

    /**
     * 更新组件配置
     *
     * @param options 配置
     */
    public updateCascader(options: ICascaderOptions<T>): void {
        const {
            columnWidth = 200,
            rowHeight = 34,
            columnTitles = [],
            value = [],
            particalCheck,
            readonly,
            disabled,
            datasource,
            showAll,
            multiple,
            association,
            spread,
            load = () => Promise.resolve([]),
            search = (query: string, itemData: ITreeMapHashItem<T, ICascaderData<T>>) =>
                itemData.search.indexOf(query) !== -1 || JSON.stringify(itemData.value).indexOf(query) !== -1
        } = options;

        const treeMapDataOptions = {
            readonly,
            disabled,
            datasource,
            showAll,
            multiple,
            association,
            spread
        };
        const treeMapValueOptions = {value, particalCheck};

        this.columnWidth = columnWidth;
        this.rowHeight = rowHeight;
        this.load = load;
        this.search = search;
        this.columnTitles = columnTitles;

        const [needUpdateDatasource, needUpdateValue] = this.treeMapData.updateTreeMapDataOptions(treeMapDataOptions);
        const needSetActiveId = this.treeMapValue.updateTreeMapValueOptions(treeMapValueOptions, needUpdateValue);

        if (needSetActiveId) {
            this.setActiveIdBySetValue(this.treeMapValue.getValue());
        }

        if (needUpdateDatasource) {
            this.emit('reset');
        }
    }

    public get multiple(): boolean {
        return this.treeMapData.multiple;
    }

    /**
     * 更改当前展示id
     *
     * @param id 编号
     */
    public setActiveId(id: string): void {

        if (this.activeId === id) {
            return;
        }

        this.activeId = id;

        const map = this.treeMapData.getItemInfo(id);

        if (map.needLoad) {

            map.needLoad = false;
            map.loading = true;

            this.emit('data-loading', id);

            this
                .load(map)
                .then((datasource: Array<ICascaderData<T>>) => {

                    map.loading = false;
                    map.children = datasource.map(item => this.treeMapData.createDataHashMap(item, map.id));
                    map.isLeaf = !map.children.length;
                    this.treeMapValue.addLoadingItemState(map.children);

                    if (!map.isLeaf && this.treeMapValue.getItemState(id) === TreeMapState.SELECTED) {
                        this.treeMapValue.setItemState(id, TreeMapState.SELECTED, true);
                    }
                    this.emit('data-loading', id);
                })
                .catch(e => {
                    console.error(e);
                    map.loading = false;
                    map.children = [];
                    map.isLeaf = true;
                    this.emit('data-loading', id);
                });
        }

        this.emit('active-change');
    }

    /**
     * 更改当前选中id
     *
     * @param id 编号
     * @param newState 新状态，多选时有效
     */
    public setItemState(id: string, newState?: TreeMapState): void {
        const success = this.treeMapValue.setItemState(id, newState);

        if (!success) {
            return;
        }

        if (this.treeMapData.multiple) {
            const state = this.getItemState(id);

            if (state === TreeMapState.SELECTED) {

                if (this.activeId == null) {
                    this.setActiveId(id);
                    return;
                }

                const item = this.getItemInfo(id);

                // 保证级别尽量展开，不收起
                if (item.nodePath.indexOf(id) < 0) {
                    this.setActiveId(id);
                }
            }
        } else {
            this.setActiveId(id);
        }
    }

    public getItemState(id: string): TreeMapState {
        return this.treeMapValue.getItemState(id);
    }

    /**
     * 获取激活元素
     *
     */
    public getAvticeId(): string {
        return this.activeId;
    }

    /**
     * 获取当前激活的元素的id路径
     */
    public getActiveIds(): string[] {
        const rootId = this.treeMapData.getRootId();
        if (!this.activeId || this.activeId === rootId) {
            return this.getItemInfo(rootId).isLeaf ? [] : [rootId];
        }

        const info = this.getItemInfo(this.activeId);

        return info ? info.nodePath || [] : [];
    }

    public getRootId(): string {
        return this.treeMapData.getRootId();
    }

    /**
     * 获取展示信息
     */
    public getDisplayInfo(): Array<ITreeMapHashItem<T, ICascaderData<T>>> {
        return this.treeMapValue.getSortedIdFromSelected().map(item => this.treeMapData.getItemInfo(item));
    }

    /**
     * 按层级获取展示信息
     */
    public getGroupDisplayInfo(): Array<IGroupDisplayInfoItem<T>> {

        const result = this.treeMapValue.getIdFromSelected().map(item => this.treeMapData.getItemInfo(item));
        const map: Array<Array<ITreeMapHashItem<T, ICascaderData<T>>>> = [];

        result.forEach(item => {
            map[item.nodePath.length - 1] = map[item.nodePath.length - 1] || [];
            map[item.nodePath.length - 1].push(item);
        });

        const ret: Array<IGroupDisplayInfoItem<T>> = [];

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

    public getColumnTitle(idx: number, parentId: string): string | null {
        if (isFunction(this.columnTitles)) { // 自定义函数
            const info = this.getItemInfo(parentId);
            return this.columnTitles(info);
        } else if (this.columnTitles.length === 0) { // 空数组则不显示 title
            return null;
        }
        return this.columnTitles[idx];

    }

    /**
     * 设置搜索关键词
     *
     * @param query 关键词
     */
    public setQuery(query: string): void {
        const hashMap = this.treeMapData.getHashMap();
        this.query = query;
        this.queries = Object
            .keys(hashMap)
            .filter(key => this.search(this.query, hashMap[key]));

        this.emit('query-change', this.queries);
    }

    /**
     * 设置搜索关键词
     */
    public getQueries(): string[] {
        return this.queries;
    }

    public resetValue(): void {
        this.treeMapValue.resetValue();
    }

    public getItemInfo(id: string): ICascaderHashItem<T> {
        return {
            ...this.treeMapData.getItemInfo(id),
            state: this.treeMapValue.getItemState(id)
        };
    }

    public dispose(): void {
        this.activeId = '';
        this.queries = [];
        this.treeMapValue.removeListener('value-change', this.valueChange);
    }

    // 加载数据源函数
    private load: ICascaderLoad<T> = () => Promise.resolve([]);

    private search: ICascaderSearch<T> = (query: string, itemData: ITreeMapHashItem<T, ICascaderData<T>>) =>
        itemData.search.indexOf(this.query) !== -1;

    private getValueFromData(data: ICascaderData<T>): T {
        return data.value;
    }

    private getLabelFromData(data: ICascaderData<T>): string {
        return data.label;
    }

    private init(): void {
        this.treeMapValue.addListener('value-change', this.valueChange);
    }

    private readonly valueChange = (value: T[]): void => {
        this.emit('change', value, this.getDisplayInfo());
        this.emit('value-change');
    };

    private setActiveIdBySetValue(value: T[]): boolean {
        if (!value.length) {
            this.activeId = '';
            this.emit('active-change');
            return true;
        }

        if ((!this.activeId || this.getItemInfo(this.activeId).state == null) && value.length) {
            this.activeId = this.treeMapData.getIdByValue(value[value.length - 1]);
            this.emit('active-change');
            return true;
        }

        return false;
    }
}
