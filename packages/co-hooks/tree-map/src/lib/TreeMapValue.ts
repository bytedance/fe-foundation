/**
 * @file TreeMapValue
 */
import {Emitter} from '@co-hooks/emitter';
import {ITreeMapHashItem, TreeMapData} from './TreeMapData';
import {shallowEqual, createMap} from "@co-hooks/util";

export enum TreeMapState {
    // 没选中
    UNSELECTED = 0,
    // 部分选中
    PARTIAL = 1,
    // 选中
    SELECTED = 2
}

export interface ITreeMapValueEvent<T> {
    'value-change': [T[]];
    'value-unvalid': [T[]];
}

export interface ITreeMapValueOptions<T> {
    value: T[];

    // 是否支持半选
    particalCheck?: boolean;
}

export class TreeMapValue<T, D> extends Emitter<ITreeMapValueEvent<T>> {

    private readonly core: TreeMapData<T, D>;

    // 级联组件的值
    private value: T[] = [];

    private particalCheck: boolean = true;

    // 值的状态
    private stateMap: {[key: string]: TreeMapState} = {};

    constructor(core: TreeMapData<T, D>) {
        super();
        this.core = core;
        this.resetHashState();
    }

    public updateTreeMapValueOptions(options: ITreeMapValueOptions<T>, forceUpdate: boolean = false): boolean {
        const {value, particalCheck = true} = options;

        this.particalCheck = particalCheck;

        if (this.value !== value && !shallowEqual(this.value, value) || forceUpdate) {
            return !this.setValueToSelected(value);
        }

        return false;
    }

    /**
     * 重置状态
     */
    public resetValue(): void {
        this.resetHashState();
        this.value = [];
        this.emit('value-change', this.value);
    }

    /**
     * 根据value值，重置stateMap
     */
    public resetValueToSelected(): void {
        this.setValueToSelected(this.value, true);
    }

    /**
     * 更改当前选中id
     *
     * @param id 编号
     * @param newState 新状态，多选时有效
     */
    public setItemState(id: string, newState?: TreeMapState, force: boolean = false): boolean {
        const item = this.core.getItemInfo(id);

        if (item.disabled || item.readonly) {
            return false;
        }

        if (this.core.multiple) {

            const state = this.stateMap[id];

            newState = newState == null
                ? state === TreeMapState.SELECTED
                    ? TreeMapState.UNSELECTED
                    : TreeMapState.SELECTED
                : newState;

            this.updateSelectedState(id, newState, force);
        } else {
            this.resetHashState();
            this.updateSelectedState(id, TreeMapState.SELECTED, force);
        }

        this.value = this.getValueFromSelected();
        this.emitValueChange();

        return true;
    }

    public getValue(): T[] {
        return this.value;
    }

    public getItemState(id: string): TreeMapState {
        return this.stateMap[id];
    }

    public getIdFromSelected(): string[] {

        const {multiple, spread} = this.core;
        const hashMap = this.core.getHashMap();

        const result = Object.keys(hashMap).filter(key => {

            const {
                nodePath,
                isLeaf,
                selectable
            } = hashMap[key];

            if (this.stateMap[key] !== TreeMapState.SELECTED) {
                return;
            }

            if (!this.core.association) { // 非全选模式返回全部选中节点
                return true;
            }

            // 展开的情况下，只要叶子节点
            if (spread) {
                return isLeaf && selectable;
            }

            // 不然只有当父亲元素没有被选中的时候，才显示
            for (let i = 1; i < nodePath.length - 1; i++) {
                if (this.stateMap[nodePath[i]] === TreeMapState.SELECTED
                    && hashMap[nodePath[i]].selectable
                ) {
                    return false;
                }
            }

            // 过滤了根节点
            return nodePath.length > 1;
        });

        if (!multiple && result.length > 1) {
            console.error('TreeMap has multiple value, but is not multiple');
        }

        return result;
    }

    public getSortedIdFromSelected(): string[] {
        const selectedIds = this.getIdFromSelected();
        const valueIds = this.value.map(item => this.core.getIdByValue(item));

        const selectedIdMap = createMap<string>(selectedIds);
        const valueIdMap = createMap(valueIds);
        const ids: string[] = [];

        valueIds.forEach(id => {
            if (selectedIdMap[id]) {
                ids.push(id);
            }
        });

        selectedIds.forEach(id => {
            if (!valueIdMap[id]) {
                ids.push(id);
            }
        });

        return ids;
    }

    // 异步加载的数据动态添加stateMap
    public addLoadingItemState(items: Array<ITreeMapHashItem<T, D>>): void {
        items.forEach(item => {
            this.stateMap[item.id] = TreeMapState.UNSELECTED;
            this.addLoadingItemState(item.children || []);
        });
    }

    private updateSelectedState(id: string, state: TreeMapState, force: boolean = false): void {
        const hashMap = this.core.getHashMap();
        if (state === TreeMapState.PARTIAL) {
            throw new Error('`state` could not be CHECKBOX_STATE_PARTIAL');
        }

        const pathNodes: Array<ITreeMapHashItem<T, D>> = hashMap[id].nodePath.map(item => hashMap[item]);
        const {association, multiple} = this.core;

        if (!pathNodes.length) {
            return;
        }

        let current: ITreeMapHashItem<T, D> | null = pathNodes.pop() || null;

        if (!current || !force && state === this.stateMap[current.id]) {
            return;
        }

        this.setHashState(current.id, state, !current.isLeaf && association && multiple);

        if (!association || !multiple) {
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
                const childState = this.stateMap[child.id];
                if (childState === TreeMapState.SELECTED) {
                    selected++;
                } else if (childState === TreeMapState.UNSELECTED || childState == null) {
                    unselected++;
                }
            });

            if (unselected === length) {
                this.setHashState(current.id, TreeMapState.UNSELECTED, false);
            } else if (selected === length) {
                this.setHashState(current.id, TreeMapState.SELECTED, false);
            } else {
                this.setHashState(
                    current.id,
                    this.particalCheck ? TreeMapState.PARTIAL : TreeMapState.UNSELECTED,
                    false
                );
            }
        }
    }

    private emitValueChange(): void {
        this.emit('value-change', this.value);
    }

    private getValueFromSelected(): T[] {
        return this.getSortedIdFromSelected().map(item => this.core.getItemInfo(item).value);
    }

    private setValueToSelected(value: T[], isSilent: boolean = false): boolean {
        const {multiple, spread} = this.core;
        if (!multiple && value.length > 1) {
            throw new Error('cascader is not multiple but has more than one value');
        }

        let unvalid = false;

        this.resetHashState();

        value.forEach((item: T) => {

            const id = this.core.getIdByValue(item);
            const node = this.core.getItemInfo(id);

            // 找不到说明值有非法的
            if (!node) {
                unvalid = true;
                return;
            }

            if (spread && node.children && node.children.length) {
                unvalid = true;
                return;
            }

            this.updateSelectedState(id, TreeMapState.SELECTED);
        });

        if (unvalid) {
            // 只发通知，不做重置
            this.emit('value-unvalid', value);
            // value = this.getValueFromSelected();
        }

        this.value = value;

        return unvalid;

        // !isSilent && this.emitValueChange();
    }

    // 重置state状态
    private resetHashState(): void {
        const hashMap = this.core.getHashMap();

        this.stateMap = {};
        Object.keys(hashMap).forEach(id => this.stateMap[id] = TreeMapState.UNSELECTED);
    }

    /**
     * 更新state状态
     *
     * @param id
     * @param state
     * @param deep
     */
    private setHashState(id: string, state: TreeMapState, deep: boolean = false): void {

        if (deep && state === TreeMapState.PARTIAL) {
            throw new Error('cant setStateAll partial');
        }

        const node = this.core.getItemInfo(id);

        if (!node) {
            throw new Error('cant setState for an inexistence item');
        }

        if (this.stateMap[id] === state) {
            return;
        }

        this.stateMap[id] = state;

        if (!deep || !node.children || !node.children.length) {
            return;
        }

        node.children.forEach((item: ITreeMapHashItem<T, D>) => this.setHashState(item.id, state, deep));
    }
}
