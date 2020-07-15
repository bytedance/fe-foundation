/**
 * @file Table 表格组件
 */
import {Emitter} from '@co-hooks/emitter';
import {IElementSize} from '@co-hooks/dom';
import {ITableOptions} from '../type';
import {ColumnManager} from './ColumnManager';
import {LeafColumnManager} from './LeafColumnManager';

export interface ITableEvents<T> {
    repaint: [];
}

// T 表示表格一行的数据模型，E表示调用表格的组件的额外信息
export class Table<T, E, K extends keyof T> extends Emitter<ITableEvents<T>> {

    private readonly columnManager: ColumnManager<T, E> = new ColumnManager();

    private readonly leafColumnManager: LeafColumnManager<T, E> = new LeafColumnManager();

    private readonly rowKey: K;

    constructor(rowKey: K) {
        super();
        this.rowKey = rowKey;
    }

    public updateTableOptions(options: ITableOptions<T, E, K>): void {

        const {columns, minimalNonFixedWidth, rowKey} = options;

        if (rowKey !== this.rowKey) {
            throw new Error('rowKey of the table must be same，set `key={rowKey}` on the table');
        }

        // 首先更新列的属性
        this.columnManager.updateColumns(columns);

        // 然后获取全部的叶子列
        const leafColumns = this.columnManager.getLeafColumns();

        // 更新叶子列
        this.leafColumnManager.updateOptions({
            columns: leafColumns,
            minimalNonFixedWidth
        });

        this.repaint();
    }

    public updateTableSize(size: IElementSize): void {
        this.leafColumnManager.updateTableWidth(size.width);
    }

    public getColumnManager(): ColumnManager<T, E> {
        return this.columnManager;
    }

    public getLeafColumnManager(): LeafColumnManager<T, E> {
        return this.leafColumnManager;
    }

    public getRowKey(): K {
        return this.rowKey;
    }

    public repaint(): void {
        this.emit('repaint');
    }

    public emitRowChange(): void {
        const manager = this.leafColumnManager;
        const columns = manager.getShownColumns();
        columns.forEach(key => {
            manager.getColumn(key).repaint();
        });
    }
}
