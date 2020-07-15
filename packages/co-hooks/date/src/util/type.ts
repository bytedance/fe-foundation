/**
 * @file type 基础类型定义
 */

import {RangeState} from './enum';

export type GridRangeState = Exclude<RangeState, RangeState.NONE | RangeState.SINGLE>;

export type RowRangeState = RangeState.START | RangeState.IN | RangeState.END | RangeState.SINGLE;

export type SelectedRangeState = Exclude<RangeState, RangeState.PREV | RangeState.NEXT>;

export interface IPanelItemState {

    // 是否今天，这个是日期特有的交互
    isToday: boolean;

    // 网格的样式类型（不支持None）
    gridState: GridRangeState;

    // 选中的样式类型（不支持前后）
    selectedState: SelectedRangeState;

    // 尝试选中的样式类型（不支持前后）
    tryingSelectedState: SelectedRangeState;

    // 禁用的样式类型（不支持前后）
    disabledState: SelectedRangeState;
}

