/**
 * @file LeafColumnManager 叶子列管理类
 */
import {Emitter} from '@co-hooks/emitter';
import {shallowEqual} from '@co-hooks/util';
import {IColumnInfo, IColumnScrollInfo, IColumnSizeInfo} from '../type';
import {Column} from './Column';

export interface ILeafColumnManagerOptions<T, E> {
    minimalNonFixedWidth?: number;
    columns: Array<Column<T, E>>;
}

interface ILeafColumnManagerEvent {
    size: [IColumnSizeInfo];
    scroll: [IColumnScrollInfo];
}

export class LeafColumnManager<T, E> extends Emitter<ILeafColumnManagerEvent> {

    // 容器总宽度
    private width: number = 0;

    // 列缓存
    private map: Record<string, Column<T, E>> = {};

    // 左边固定列
    private fixedLeftColumns: string[] = [];

    // 中间列
    private nonFixedColumns: string[] = [];

    // 右边固定列
    private fixedRightColumns: string[] = [];

    private minimalNonFixedWidth: number = 0;

    private nonFixedScroll: number = 0;

    public updateOptions(options: ILeafColumnManagerOptions<T, E>): void {

        const {minimalNonFixedWidth = 0, columns} = options;

        this.minimalNonFixedWidth = minimalNonFixedWidth;
        this.updateColumns(columns);
        this.emit('size', this.getColumnSizeInfo());
    }

    public getHeadDeep(): number {
        const leaf = this;
        return Math.max(...leaf.getShownColumns().map(key => leaf.getColumn(key).getLevel()));
    }

    public getColumnSizeInfo(): IColumnSizeInfo {

        const leaf = this;

        return {
            tableWidth: leaf.getTableWidth(),
            fixedLeftWidth: leaf.ignoreFixedLeft() ? 0 : leaf.getFixedLeftWidth(),
            visibleWidth: leaf.getVisibleWidth(),
            scrollerWidth: leaf.getScrollerWidth(),
            fixedRightWidth: leaf.ignoreFixedRight() ? 0 : leaf.getFixedRightWidth(),
            ignoreFixedLeft: leaf.ignoreFixedLeft(),
            ignoreFixedRight: leaf.ignoreFixedRight()
        };
    }

    public getColumnScrollInfo(): IColumnScrollInfo {

        const leaf = this;

        return {
            scroll: this.nonFixedScroll,
            isFixedLeftCover: leaf.isFixedLeftCover(),
            isFixedRightCover: leaf.isFixedRightCover()
        };
    }

    public isFirstShowColumn(key: string): boolean {

        const first = this.getShownColumns().shift();

        if (first == null) {
            return false;
        }
        const map: Record<string, boolean> = {};
        let column: IColumnInfo<T, E> | null = this.getColumn(first);

        while (column != null) {
            map[column.getKey()] = true;
            column = column.getParent();
        }

        return map[key];
    }

    public isLastShownColumn(key: string): boolean {

        const first = this.getShownColumns().pop();

        if (first == null) {
            return false;
        }

        const map: Record<string, boolean> = {};
        let column: IColumnInfo<T, E> | null = this.getColumn(first);

        while (column != null) {
            map[column.getKey()] = true;
            column = column.getParent();
        }

        return map[key];
    }

    // region Table宽度
    public updateTableWidth(width: number): void {

        if (width !== this.width) {
            this.width = width;
            this.updateColumnSize();
            this.emit('size', this.getColumnSizeInfo());
        }
    }

    // 获取Table的宽度
    public getTableWidth(): number {
        return this.width;
    }

    // endregion Table宽度

    // region 滚动相关

    // 滚动值
    public getNonFixedScroll(): number {
        return this.nonFixedScroll;
    }

    public updateNonFixedScroll(scroll: number): void {

        const max = this.getScrollerWidth() - this.getVisibleWidth();

        scroll = Math.min(Math.max(0, scroll), max);

        if (scroll !== this.nonFixedScroll) {
            this.nonFixedScroll = scroll;
            this.emit('scroll', this.getColumnScrollInfo());
        }
    }

    // 可视区域的大小
    public getVisibleWidth(): number {
        return this.getTableWidth()
            - (this.ignoreFixedLeft() ? 0 : this.getFixedLeftWidth())
            - (this.ignoreFixedRight() ? 0 : this.getFixedRightWidth());
    }

    // 滚动区域的大小
    public getScrollerWidth(): number {
        return this.getNonFixedWidth()
            + (this.ignoreFixedLeft() ? this.getFixedLeftWidth() : 0)
            + (this.ignoreFixedRight() ? this.getFixedRightWidth() : 0);
    }

    // endregion 滚动相关

    // region 列名相关
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

    public getColumn(key: string): Column<T, E> {
        return this.map[key];
    }

    // endregion 列名相关

    // region 宽度相关

    // 固定左边的宽度
    public getFixedLeftWidth(): number {
        return this.fixedLeftColumns.reduce((sum, item) => sum + this.getColumn(item).getWidth(), 0);
    }

    // 不固定的宽度
    public getNonFixedWidth(): number {
        return this.nonFixedColumns.reduce((sum, item) => sum + this.getColumn(item).getWidth(), 0);
    }

    // 固定右边的宽度
    public getFixedRightWidth(): number {
        return this.fixedRightColumns.reduce((sum, item) => sum + this.getColumn(item).getWidth(), 0);
    }

    public ignoreFixed(): boolean {

        // 左中右加起来刚刚好一样的时候，不需要显示Fixed
        return this.getFixedLeftWidth() + this.getFixedRightWidth() + this.getNonFixedWidth() <= this.getTableWidth();
    }

    public ignoreFixedLeft(): boolean {
        // 如果左边长度为0
        // 如果左边的宽度已经大于Table的总宽度 - 预留宽度，就不必要固定左边了，不然中间的内容根本看不到
        return this.ignoreFixed()
            || this.getFixedLeftWidth() === 0
            || this.getFixedLeftWidth() > this.getTableWidth() - this.minimalNonFixedWidth;
    }

    public ignoreFixedRight(): boolean {

        // 如果右边长度为0
        // 如果左右固定列的宽度和已经大于Table的总宽度 - 预留宽度，就不必要固定右边了，不然中间的内容根本看不到
        return this.ignoreFixed()
            || this.getFixedRightWidth() === 0
            || this.getFixedLeftWidth() + this.getFixedRightWidth() > this.getTableWidth() - this.minimalNonFixedWidth;
    }

    // 左边是否覆盖了东西，可能要根据这个加样式
    public isFixedLeftCover(): boolean {
        return !this.ignoreFixedLeft() && this.nonFixedScroll > 0;
    }

    // 右边是否覆盖了东西
    public isFixedRightCover(): boolean {

        if (this.ignoreFixedRight()) {
            return false;
        }

        return this.getScrollerWidth() - this.nonFixedScroll > this.getVisibleWidth();
    }

    // endregion 宽度相关

    // 计算列宽度
    private updateColumnSize(): void {

        const shownColumns = this.getShownColumns();

        let width = this.width;
        let allColumnsMap: Record<string, number> = {};
        let autoColumns: string[] = [];

        let miniWidth = shownColumns.reduce((sum, key) => {

            const column = this.map[key];

            if (!column.getFixedType() && !column.isWidthFixed()) {
                autoColumns.push(column.getKey());
            }

            return sum + (allColumnsMap[column.getKey()] = column.getExpectWidth());
        }, 0);

        // 处理不足时，给auto加宽度
        if (miniWidth <= width) {

            let left = width - miniWidth;

            // 有可扩展列，则其他列保持不变，不然整体放大
            let effectColumns = autoColumns.length ? autoColumns : shownColumns;
            let len = effectColumns.length;
            let delta = Math.floor(left / len);

            effectColumns.forEach((item, i) => {

                allColumnsMap[item] += delta;

                // 一点像素误差，给最后一列
                if (i === len - 1) {
                    allColumnsMap[item] += left - delta * len;
                }
            });
        }

        shownColumns.forEach(key => {
            this.map[key].setWidth(allColumnsMap[key]);
        });
    }

    private updateColumns(columns: Array<Column<T, E>>): void {

        const map: Record<string, Column<T, E>> = {};
        const oldLeft = this.fixedLeftColumns;
        const oldNonFixed = this.nonFixedColumns;
        const oldRight = this.fixedRightColumns;
        let fixedLeftColumns: string[] = [];
        let nonFixedColumns: string[] = [];
        let fixedRightColumns: string[] = [];

        columns.forEach(item => {

            const key = item.getKey();

            if (map[key]) {
                throw new Error('duplicate column key = ' + key);
            }

            map[key] = item;

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

        this.map = map;
        this.updateColumnSize();
    }
}
