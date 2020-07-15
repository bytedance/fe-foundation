/**
 * @file ColumnBase 列基础属性
 */

import {Emitter} from '@co-hooks/emitter';
import {ColumnFixedType, ColumnType, IColumnCommonOptions, IColumnInfo} from '../type';
import {ColumnGroup} from './ColumnGroup';
import {ColumnManager} from './ColumnManager';

export interface IColumnEvents {
    repaint: [];
}

export class ColumnBase<T, E> extends Emitter<IColumnEvents> implements IColumnInfo<T, E> {

    public renderHead: () => E;

    protected readonly key: string;

    protected readonly manager: ColumnManager<T, E>;

    protected readonly parent: ColumnGroup<T, E> | null;

    protected readonly type: ColumnType;

    protected show: boolean = false;

    protected fixed: ColumnFixedType = false;

    protected disposed: boolean = false;

    constructor(manager: ColumnManager<T, E>, options: IColumnCommonOptions<T, E>, parent?: ColumnGroup<T, E>) {

        super();

        const {
            key,
            type,
            renderHead
        } = options;

        this.manager = manager;
        this.parent = parent || null;

        this.type = type;
        this.key = key;
        this.renderHead = renderHead;
    }

    public repaint(): void {
        this.emit('repaint');
    }

    public updateColumnOptions(options: IColumnCommonOptions<T, E>): void {

        const {
            type,
            fixed = false,
            show = true,
            key,
            renderHead
        } = options;

        if (type !== this.type) {
            throw new Error(`update column with different type, expect = ${this.type}actual = ${type}`);
        }

        if (key !== this.key) {
            throw new Error(`update column with different key, expect = ${this.key}actual = ${key}`);
        }

        this.renderHead = renderHead;
        this.fixed = fixed;
        this.show = show;
    }

    public isTop(): boolean {
        return this.parent == null;
    }

    public getParent(): ColumnGroup<T, E> | null {
        return this.parent;
    }

    public getFixedType(): ColumnFixedType {
        const parent = this.getParent();
        return parent ? parent.getFixedType() : this.fixed;
    }

    public getKey(): string {
        return this.key;
    }

    public isShow(): boolean {
        return this.show;
    }

    public isParentShow(): boolean {
        const parent = this.getParent();
        return parent ? parent.isParentShow() && this.isShow() : this.isShow();
    }

    public isActualShow(): boolean {

        // 自己不显示
        if (!this.isShow()) {
            return false;
        }

        // 父级不显示
        if (!this.isParentShow()) {
            return false;
        }

        // 对于Group来说，还要判断孩子是否要显示
        if (this.isGroup()) {
            return this.getColumns().some(item => item.isActualShow());
        }

        return true;
    }

    public getLevel(): number {
        const parent = this.getParent();
        return parent ? parent.getLevel() + 1 : 1;
    }

    public isGroup(): this is ColumnGroup<T, E> {
        return this.type === ColumnType.GROUP;
    }

    public dispose(): void {

        if (this.disposed) {
            return;
        }

        // 提前解绑事件
        this.removeAllListeners();
        this.disposed = true;
    }

    public isDisposed(): boolean {
        return this.disposed;
    }

    public getType(): ColumnType {
        return this.type;
    }
}
