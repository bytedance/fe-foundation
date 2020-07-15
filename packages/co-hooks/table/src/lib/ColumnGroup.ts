/**
 * @file ColumnGroup 列分组
 */

import {shallowEqual} from '@co-hooks/util';
import {IColumnGroupOptions} from '../type';
import {Column} from './Column';
import {ColumnBase} from './ColumnBase';

export class ColumnGroup<T, E> extends ColumnBase<T, E> {

    private columns: Array<ColumnGroup<T, E> | Column<T, E>> = [];

    public updateColumnOptions(options: IColumnGroupOptions<T, E>): void {

        super.updateColumnOptions(options);

        const {children} = options;

        const oldColumns = this.columns;
        const newMap: Record<string, Column<T, E> | ColumnGroup<T, E>> = {};
        const newColumns = children.map(
            options => newMap[options.key] = this.manager.createOrUpdateColumn(options, this)
        );

        if (!shallowEqual(oldColumns, newColumns)) {
            this.columns = newColumns;
        }
    }

    public getColumns(): Array<ColumnGroup<T, E> | Column<T, E>> {
        return this.columns;
    }

    public getRenderColumnKeys(): string[] {
        return this.columns.filter(item => item.isActualShow()).map(item => item.getKey());
    }

    public dispose(): void {
        super.dispose();
        this.columns.forEach(item => item.dispose());
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
}
