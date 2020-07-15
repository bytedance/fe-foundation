/**
 * @file index
 */
import {ColumnGroup} from '../lib/ColumnGroup';

export type ColumnFixedType = 'left' | 'right' | false;

export enum ColumnType {
    LEAF,
    GROUP
}

// E用于表示平台渲染的标的
export interface IColumnCommonOptions<T, E> {

    // 列的类型
    type: ColumnType;

    // 列的唯一标识
    key: string;

    // 渲染表头函数
    renderHead: () => E;

    // 是否现实
    show?: boolean;

    // 是否固定
    fixed?: ColumnFixedType;
}

export interface IColumnLeafOptions<T, E> extends IColumnCommonOptions<T, E> {

    type: ColumnType.LEAF;

    // 叶子列有宽度
    width: number;

    // 列宽是否尽量固定
    widthFixed?: boolean;

    // 渲染单元格函数
    renderData: (row: T, expand: IRowExpandInfo, onExpand: (expanded: boolean) => void) => E;

    // 当列变化的时候
    onRowChange?: () => void;

    // 当前列要加的className
    className?: string;
}

export interface IColumnGroupOptions<T, E> extends IColumnCommonOptions<T, E> {

    type: ColumnType.GROUP;

    // 子列
    children: Array<Omit<IColumnGroupOptions<T, E>, 'fixed'> | Omit<IColumnLeafOptions<T, E>, 'fixed'>>;
}

export type IColumnOptions<T, E> = IColumnLeafOptions<T, E> | IColumnGroupOptions<T, E>;

export interface IColumnInfo<T, E> {

    // 是否顶级列
    isTop: () => boolean;

    // 获取列唯一标识
    getKey: () => string;

    // 列固定的类型
    getFixedType: () => ColumnFixedType;

    // 列是否显示
    isShow: () => boolean;

    // 父元素否显示
    isParentShow: () => boolean;

    // 列是否实际要显示
    isActualShow: () => boolean;

    // 是否是分组
    isGroup: () => this is ColumnGroup<T, E>;

    // 获取所属的父级组件
    getParent: () => ColumnGroup<T, E> | null;

    // 获取所处层级
    getLevel: () => number;

    // 获取列类型
    getType: () => ColumnType;

    // 销毁组件
    dispose: () => void;

    // 是否已经销毁
    isDisposed: () => boolean;
}

export interface ITableOptions<T, E, K extends keyof T> {

    // 列标识
    rowKey: K;

    // 列显示相关
    minimalNonFixedWidth: number;
    columns: Array<IColumnOptions<T, E>>;
}

export interface IColumnSizeInfo {
    tableWidth: number;
    fixedLeftWidth: number;
    visibleWidth: number;
    scrollerWidth: number;
    fixedRightWidth: number;
    ignoreFixedLeft: boolean;
    ignoreFixedRight: boolean;

}

export interface IColumnScrollInfo {
    isFixedLeftCover: boolean;
    isFixedRightCover: boolean;
    scroll: number;
}

export interface IRowExpandInfo {
    isLeaf: boolean;
    level: number;
    expanded: boolean;
}
