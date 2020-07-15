/**
 * @file Cascader
 */

import {isFunction, uniqueString} from '@co-hooks/util';
import {
    CascaderCore,
    CascaderState,
    ICascaderCoreEvent,
    ICascaderCoreOption,
    ICascaderDatasource, IHashMapItem
} from './CascaderCore';

export interface ICascaderExtra<T> {
    // 列宽，默认200
    columnWidth?: number;
    onChange?: (value: T[]) => void;
    onExpand?: (value: T[]) => void;
}

export type ICascaderOptions<T, P> = ICascaderExtra<T> & ICascaderCoreOption<T, P>;

export interface ICascaderEvent<T> extends ICascaderCoreEvent<T> {
    'expanded-change': [];
    'expanded': [T[]];
    'item-loading': [string];
    'try-set-item-state': [];
}

export class Cascader<T, P> extends CascaderCore<T, P, ICascaderEvent<T>> {

    // 存储 tree 搜索时匹配的节点
    public treeSearchMatchNodes: string[] | null = null;

    // 列宽
    public columnWidth: number = 200;

    // 当前激活元素
    private expandedIds: string[] = [];

    private inited: boolean = false;

    /**
     * 更新组件配置
     *
     * @param options 配置
     */
    public updateCascader(options: ICascaderOptions<T, P>): void {

        this.columnWidth = options.columnWidth == null ? 200 : options.columnWidth;

        const {needUpdateValue} = this.updateCascaderOptions(options);

        if (options.expandedIds !== undefined) {
            this.expandedIds = this.getExpandedIdsByValue(options.expandedIds);
        } else if (!this.inited && options.defaultExpandedIds !== undefined) {
            this.expandedIds = this.getExpandedIdsByValue(options.defaultExpandedIds);
        }

        if (needUpdateValue && this.selectToExpand) {
            this.setExpandedBySetValue(this.value);
        }

        this.inited = true;
    }

    public dispose(): void {
        super.dispose();
        this.expandedIds = [];
        this.inited = false;
        this.removeAllListeners('expanded-change');
        this.removeAllListeners('expanded');
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

    public getExpandedIdsByValue(value: T[]): string[] {

        const ids = this.getIdsByValues(value);
        const expandedIds = ids.slice(0);

        ids.forEach(id => {
            const node = this.getItemInfo(id);

            node.nodePath.forEach(expandedId => {
                if (expandedIds.indexOf(expandedId) === -1) {
                    expandedIds.push(expandedId);
                }
            });
        });

        return expandedIds;
    }

    /**
     * 更改当前展示id
     *
     * @param id 编号
     * @param expanded
     */
    public setExpanded(id: string, expanded: boolean = true): void {

        const info = this.getItemInfo(id);
        const idx = this.expandedIds.indexOf(id);

        if (this.accordion) { // 手风琴模式
            if (expanded) {
                this.expandedIds = info.nodePath.slice(0);
            } else if (!expanded) {
                this.expandedIds = idx > -1 ? this.expandedIds.slice(0, idx) : [];
            }
        } else { // 非手风琴模式
            if (expanded) { // 展开，如果当前节点的父元素已经被展开了则不再展开
                info.nodePath.forEach(expandedId => {
                    if (this.expandedIds.indexOf(expandedId) === -1) {
                        this.expandedIds.push(expandedId);
                    }
                });
            } else { // 不展开，当前后代元素都进行折叠
                const descendants = this.getDescendants(id);
                const ids = descendants.concat(id);

                this.expandedIds = this.expandedIds.splice(0).filter(expandedId => ids.indexOf(expandedId) === -1);
            }
        }

        if (info.needLoad) {

            info.needLoad = false;
            info.loading = true;

            this.emit('item-loading', id);

            this.load(info)
                .then((datasource: Array<ICascaderDatasource<T, P>>) => {

                    info.loading = false;
                    info.children = datasource.map(item => this.createDataHashMap(item, info.id, info.level + 1));
                    info.isLeaf = info.children.length <= 0;

                    if (!info.isLeaf && info.state === CascaderState.SELECTED) {

                        info.state = CascaderState.UNSELECTED;
                        this.updateSelectedState(id, CascaderState.SELECTED);

                        // 展开模式才需要change
                        if (this.spread) {
                            this.emit('value-change');
                            this.emit('change', this.value = this.getValueFromSelected());
                        }
                    }
                    this.emit('item-loading', id);
                })
                .catch(e => {
                    console.error(e);
                    info.loading = false;
                    info.children = [];
                    info.isLeaf = true;
                    this.emit('item-loading', id);
                });
        }

        this.emit('expanded-change');
        this.emit('expanded', this.getValueFromExpanded());
    }

    public getValueFromExpanded(withLeaf: boolean = false): T[] {
        const value: T[] = [];

        this.expandedIds.forEach(id => {
            const node = this.hashMap[id];
            if (node.level === 0) { // 过滤掉根节点
                return;
            }
            if (withLeaf || (!withLeaf && !node.isLeaf)) {
                value.push(node.value);
            }
        });
        return value;
    }

    /**
     * 获取当前激活的元素的id
     *
     */
    public getExpandedIds(): string[] {
        if (this.expandedIds.length > 0) {
            return this.expandedIds;
        }

        return this.hashMap[this.root].isLeaf ? [] : [this.root];
    }

    public getExpandedItemIds(): string[] {

        const root = this.getItemInfo(this.getRootId());
        const ids: string[] = [];

        const fn = (list: Array<IHashMapItem<T, P>>): void => {
            list.forEach(item => {

                if (this.isItemExpended(item.id)) {
                    ids.push(item.id);
                }

                fn(item.children);
            });
        };

        fn(root.children);
        return ids;
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

        this.emit('try-set-item-state');
        super.setItemState(id, newState);

        if (this.selectToExpand === false) {
            return;
        }

        if (this.multiple) {

            const state = this.hashMap[id].state;

            if (state === CascaderState.SELECTED) {

                if (this.expandedIds.length === 0) {
                    this.setExpanded(id);
                    return;
                }

                this.expandedIds.every(expandedId => {
                    const expandedNode = this.hashMap[expandedId];

                    // 保证级别尽量展开，不收起
                    if (expandedNode.nodePath.indexOf(id) < 0) {
                        this.setExpanded(id);
                        return false;
                    }
                    return true;
                });
            }
        } else {
            this.setExpanded(id);
        }
    }

    // todo
    /**
     * 更改当前选中id
     *
     * @param ids 编号数组
     * @param newState 新状态，多选时有效
     */
    // public setCascaderQueryState(ids: string[], newState?: CascaderState): void {
    //     const [queries, state] = this.setQueryState(ids, newState);

    //     let activeId = '';
    //     let currentChecked = false;

    //     if (!queries.length) {
    //         return;
    //     }

    //     queries.forEach(item => {
    //         activeId = item.id;

    //         if (activeId === this.activeId) {
    //             currentChecked = true;
    //         }
    //     });

    //     if (currentChecked && state === CascaderState.UNSELECTED) {
    //         this.activeId = '';
    //     } else {
    //         this.activeId = activeId;
    //     }

    //     this.emit('expanded-change');
    // }

    public resetValue(): void {
        this.emit('change', []);
    }


    public setTreeSearch(query: string): void {

        let expandedIds: string[] = [];
        this.treeSearchMatchNodes = [];

        if (query) {
            Object.keys(this.hashMap).forEach(id => {
                const map = this.hashMap[id];

                if (map.label.indexOf(query) > -1 && this.treeSearchMatchNodes) {
                    this.treeSearchMatchNodes = this.treeSearchMatchNodes.concat(map.nodePath); // 子节点match，则父节点match
                    expandedIds = expandedIds.concat(map.nodePath.slice(0, -1)); // 如果子节点没选中的不展开，所以去掉最后一个节点
                }
            });
        } else {
            this.treeSearchMatchNodes = null; // 输入空字符串则清空搜索
        }

        this.expandedIds = uniqueString(expandedIds);
        this.emit('expanded-change');
    }

    public matchTreeSearch(id: string): boolean {

        if (this.treeSearchMatchNodes === null) { // 为 null 时，匹配所有项
            return true;
        }

        return this.treeSearchMatchNodes.indexOf(id) > -1;
    }


    private setExpandedBySetValue(value: T[]): boolean {

        if (!value.length) {
            this.expandedIds = [];
            this.emit('expanded-change');
            return true;
        }

        const hashMapKeys = Object.keys(this.hashMap);

        this.expandedIds = this.expandedIds.filter(expandedId => hashMapKeys.indexOf(expandedId) > -1);
        if (this.expandedIds.length === 0) {
            const id = this.getIdByValue(value[value.length - 1]);

            this.setExpanded(id);
            return true;
        }

        return false;
    }

    private isItemExpended(id: string) {

        const item = this.getItemInfo(id);
        const expandIds = this.expandedIds;

        // 一级永远展开
        if (item.level === 1) {
            return true;
        }

        return expandIds.some(key => {
            return this.getItemInfo(key).nodePath.indexOf(id) >= 0;
        });
    }
}
