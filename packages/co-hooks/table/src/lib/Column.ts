/**
 * @file Column 列信息管理
 */
import {IColumnLeafOptions, IRowExpandInfo} from '../type';
import {ColumnGroup} from './ColumnGroup';
import {ColumnManager} from './ColumnManager';
import {ColumnBase} from './ColumnBase';

const noop = (): void => void 0;


export class Column<T, E> extends ColumnBase<T, E> {

    public renderData: (row: T, expand: IRowExpandInfo, onExpand: (expanded: boolean) => void) => E;

    public onRowChange: () => void;

    private expectWidth: number = 0;

    private widthFixed: boolean = false;

    private width: number = 0;

    private className: string;

    constructor(manager: ColumnManager<T, E>, options: IColumnLeafOptions<T, E>, parent?: ColumnGroup<T, E>) {
        super(manager, options, parent);
        this.renderData = options.renderData;
        this.onRowChange = options.onRowChange || noop;
        this.className = options.className || '';
    }

    public updateColumnOptions(options: IColumnLeafOptions<T, E>): void {

        super.updateColumnOptions(options);

        const {widthFixed = false, width, renderData, className} = options;

        this.className = className || '';
        this.expectWidth = width;
        this.widthFixed = widthFixed;
        this.renderData = renderData;
        this.onRowChange = options.onRowChange || noop;
        this.repaint();
    }

    public getExpectWidth(): number {
        return this.expectWidth;
    }

    public isWidthFixed(): boolean {
        return this.widthFixed;
    }

    public getWidth(): number {
        return this.width;
    }

    public setWidth(width: number): void {

        if (width !== this.width) {
            this.width = width;
            this.repaint();
        }
    }

    public isShow(): boolean {
        // 预期宽度为0，就不显示了
        return this.show && this.expectWidth !== 0;
    }

    public getClassName(): string {
        return this.className;
    }
}
