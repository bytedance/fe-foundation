/**
 * @file diff
 */

export enum PropConflictType {
    NONE = 'NONE',
    DOUBLE_EDIT = 'DOUBLE_EDIT'
}

export enum DiffType {
    NONE = 'NONE',
    ADD = 'ADD',
    REMOVE = 'REMOVE',
    MOVE = 'MOVE',
    EDIT = 'EDIT',
    EDIT_ITEM = 'EDIT_ITEM'
}

export enum DataType {
    'DIFF' = 'DIFF',
    'MERGE' = 'MERGE'
}

export type IPropMergedDiffItem = IPropMergedEditDiffItem | IPropMergeEditItemDiffItem;

export interface IPropMergedEditDiffItem {
    key: string;
    type: DiffType.EDIT;
    baseValue: any;
    diffValue: any;
    mergeValue: any;
    conflict?: PropConflictType;
}

export interface IPropMergeEditItemDiffItem {
    type: DiffType.EDIT_ITEM;
    items: Record<string, IPropMergedEditDiffItem>;
}

export interface IListPrimaryDiffItem {
    type: Exclude<DiffType, DiffType.MOVE | DiffType.EDIT | DiffType.EDIT_ITEM>;
    id: string;
    dataType: DataType;
}

// 组件prop 冲突map
export type IBrickPropMergedDiff = Record<string, IPropMergedDiffItem>;

export type IBrickPropListedDiff = Record<string, IListPrimaryDiffItem[]>;

export interface IBrickPropMergedDiffItem {
    edit: IBrickPropMergedDiff;
    sort: IBrickPropListedDiff;
}

export interface IBrickPropMergedListedDiffItem extends IListPrimaryDiffItem {
    data: any;
}

export type IBrickPropMergedListedDiff = Record<string, IBrickPropMergedListedDiffItem[]>;

export interface IBrickPropMergedDiffs {
    edit: IBrickPropMergedDiff;
    sort: IBrickPropMergedListedDiff;
}

export enum PropDiffId {
    BIND = 'prop',
    DEFAULT = '__diff_id__'
}
