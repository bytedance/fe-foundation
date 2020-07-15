/**
 * @file ColumnManager 列管理
 */
import {shallowEqual} from '@co-hooks/util';
import {ColumnType, IColumnOptions} from '../type';
import {Column} from './Column';
import {ColumnGroup} from './ColumnGroup';

export class ColumnManager<T, E> {

    // 当前所有的顶级列
    private columns: Array<Column<T, E> | ColumnGroup<T, E>> = [];

    // 列缓存映射
    private readonly map: Record<string, Column<T, E> | ColumnGroup<T, E>> = {};

    // 左边固定列
    private fixedLeftColumns: string[] = [];

    // 中间列
    private nonFixedColumns: string[] = [];

    // 右边固定列
    private fixedRightColumns: string[] = [];

    public createOrUpdateColumn(
        options: IColumnOptions<T, E>,
        parent?: ColumnGroup<T, E>
    ): Column<T, E> | ColumnGroup<T, E> {

        const map = this.map;
        const old = map[options.key];

        if (old != null && old.getParent() === (parent || null)) {

            if (old.isGroup() && options.type === ColumnType.GROUP) {
                old.updateColumnOptions(options);
                return map[options.key];
            }

            if (!old.isGroup() && options.type === ColumnType.LEAF) {
                old.updateColumnOptions(options);
                return map[options.key];
            }
        }

        if (old) {
            old.dispose();
        }

        if (options.type === ColumnType.GROUP) {
            const group = map[options.key] = new ColumnGroup(this, options, parent);
            group.updateColumnOptions(options);
            return group;
        }

        const leaf = map[options.key] = new Column(this, options, parent);
        leaf.updateColumnOptions(options);
        return leaf;
    }

    public updateColumns(columns: Array<IColumnOptions<T, E>>): void {

        const oldColumns = this.columns;
        const newMap: Record<string, Column<T, E> | ColumnGroup<T, E>> = {};
        const newColumns = columns.map(options => newMap[options.key] = this.createOrUpdateColumn(options));

        if (!shallowEqual(oldColumns, newColumns)) {
            this.columns = newColumns;
        }

        // 清理没用的列
        Object.keys(this.map).forEach(key => {

            const column = this.map[key];

            if (column.isDisposed()) {
                delete this.map[key];
            }
        });
        this.updateShownColumns();
    }

    public getFixedLeftColumns(): string[] {
        return this.fixedLeftColumns;
    }

    public getNonFixedColumns(): string[] {
        return this.nonFixedColumns;
    }

    public getFixedRightColumns(): string[] {
        return this.fixedRightColumns;
    }

    public getShownColumns(): string[] {
        return [
            ...this.fixedLeftColumns,
            ...this.nonFixedColumns,
            ...this.fixedRightColumns
        ];
    }

    public getColumn(key: string): Column<T, E> | ColumnGroup<T, E> {
        return this.map[key];
    }

    public getLeafColumns(): Array<Column<T, E>> {

        const columns: Array<Column<T, E>> = [];

        this.columns.forEach(item => {

            if (item.isGroup()) {
                columns.push(...item.getLeafColumns());
                return;
            }

            columns.push(item);
        });

        return columns;
    }

    private updateShownColumns(): void {

        const oldLeft = this.fixedLeftColumns;
        const oldNonFixed = this.nonFixedColumns;
        const oldRight = this.fixedRightColumns;
        let fixedLeftColumns: string[] = [];
        let nonFixedColumns: string[] = [];
        let fixedRightColumns: string[] = [];

        this.columns.forEach(item => {

            if (!item.isActualShow()) {
                return;
            }

            const type = item.getFixedType();

            if (type === 'left') {
                fixedLeftColumns.push(item.getKey());
                return;
            }

            if (type === 'right') {
                fixedRightColumns.push(item.getKey());
                return;
            }

            nonFixedColumns.push(item.getKey());
        });

        // 中间没有滚动的元素，优先把后边的当可滚动的
        if (nonFixedColumns.length === 0) {
            nonFixedColumns = fixedRightColumns;
            fixedRightColumns = [];
        }

        // 如果没有滚动的元素，把左边的当可滚动的
        if (nonFixedColumns.length === 0) {
            nonFixedColumns = fixedLeftColumns;
            fixedLeftColumns = [];
        }

        if (!shallowEqual(oldLeft, fixedLeftColumns)) {
            this.fixedLeftColumns = fixedLeftColumns;
        }

        if (!shallowEqual(oldNonFixed, nonFixedColumns)) {
            this.nonFixedColumns = nonFixedColumns;
        }

        if (!shallowEqual(oldRight, fixedRightColumns)) {
            this.fixedRightColumns = fixedRightColumns;
        }
    }
}
