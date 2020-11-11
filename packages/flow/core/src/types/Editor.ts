/**
 * @file Editor
 */
import {IBoardInfo, IBrickData, ILayoutConfig} from '@chief-editor/base';
import {FunctionAny} from '@co-hooks/util';

export interface IEditorBrickConfig<V, DS, DP, CG, ST> {

    type: string;

    isContainer?: boolean;

    category: string;

    mockData: DS;

    schema?: any;

    staticSchema?: any;

    hooks?: Record<string, FunctionAny>;

    getPartKeyMapFromBrickData?(data: IBrickData<V, DS, DP, CG, ST>): string[];

    getInitialState: (data: IBrickData<V, DS, DP, CG, ST>) => ST;

    mergeStateWithBrickData: (current: ST, data: IBrickData<V, DS, DP, CG, ST>) => ST;

    getDefaultLayout: () => ILayoutConfig;

    getPartBoardInfoFromBrickData: (data: IBrickData<V, DS, DP, CG, ST>, part: string) => IBoardInfo;

    getDatasourceFromBrickData: (data: IBrickData<V, DS, DP, CG, ST>) => DS;

    // 默认必须要获取默认值，但是不一定要写入
    getValueFromBrickData: (data: IBrickData<V, DS, DP, CG, ST>) => V;

    setValueToBrickData?: (data: IBrickData<V, DS, DP, CG, ST>, value: V) => void;

    getDisplayFromBrickData: (data: IBrickData<V, DS, DP, CG, ST>) => DP;
}

export interface IEditorBrickConfigs {
    [key: string]: IEditorBrickConfigGlobal;
}

export type IEditorBrickConfigGlobal = IEditorBrickConfig<any, any, any, any, any>;
