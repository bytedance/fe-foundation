/**
 * @file RowGroup 列组合
 */
import {Emitter} from '@co-hooks/emitter';
import {IRowExpandInfo} from '@co-hooks/table';
import {TreeMapData} from '@co-hooks/tree-map';
import {guid} from '@co-hooks/util';
import {Table} from './Table';

export interface IRowGroupOptions<T extends {children?: T[]}, K extends keyof T> {

    // 数据源
    datasource: T[];

    // 展开的元素
    expandedRowKeys: Array<T[K]>;
}

export interface IRowGroupEvent<T extends {children?: T[]}, K extends keyof T> {
    'expanded-change': [Array<T[K]>];
}

export interface IRowGroupItem<T> extends IRowExpandInfo {
    id: string;
    row: T;
}

export class RowGroup<T extends {children?: T[]}, E, K extends keyof T> extends Emitter<IRowGroupEvent<T, K>> {

    public readonly id: string = guid();

    private readonly map: TreeMapData<T[K], T>;

    private readonly table: Table<T, E, K>;

    private expandedRowKeyMap: Record<string, boolean> = {};

    private expandedRows: Array<T[K]> = [];

    constructor(table: Table<T, E, K>) {

        super();

        this.table = table;
        const rowKey = table.getRowKey();
        this.map = new TreeMapData(
            (datasource: T) => datasource[rowKey],
            (datasource: T) => String(datasource[rowKey])
        );
    }

    public updateRowGroup(options: IRowGroupOptions<T, K>): void {

        const {expandedRowKeys} = options;
        const expandedRowKeyMap: Record<string, boolean> = {};
        const map = this.map;

        map.updateTreeMapDataOptions(options);
        expandedRowKeys.forEach(value => {
            const {nodePath} = map.getItemInfo(map.getIdByValue(value));
            nodePath.forEach(id => expandedRowKeyMap[id] = true);
        });

        this.expandedRowKeyMap = expandedRowKeyMap;
        this.expandedRows = expandedRowKeys;
    }

    public getRenderRows(): Array<IRowGroupItem<T>> {

        const expandedRowKeyMap = this.expandedRowKeyMap;
        const map = this.map;

        return map
            .getRenderList()
            .filter(item => item.level === 1 || expandedRowKeyMap[item.parentId as string])
            .map(item => {

                const {id, isLeaf, level} = item;

                return {
                    id,
                    isLeaf,
                    level,
                    expanded: expandedRowKeyMap[id],
                    row: item.item
                };
            });
    }

    public setRowExpand(id: string, expanded: boolean): void {

        const map = this.map;
        const info = map.getItemInfo(id);

        if (this.expandedRowKeyMap[id] !== expanded) {

            const list = this.expandedRows.slice(0);
            const value = this.map.getItemInfo(id).value;

            for (let i = list.length - 1; i >= 0; i--) {
                if (map.getItemInfo(map.getIdByValue(list[i])).nodePath.indexOf(id) >= 0) {
                    list.splice(i, 1);
                }
            }

            if (expanded) {
                list.push(value);
            } else if (info.level > 1) {
                list.push(map.getItemInfo(info.parentId as string).value);
            }

            this.emit('expanded-change', list);
        }
    }
}
