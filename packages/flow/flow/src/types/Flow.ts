/**
 * @file Flow
 */
import {IBoardInfo, IBrick, IBrickDataGlobal, IBrickInstance, IValidateInfo} from '@chief-editor/base';

export type PromiseResult<T> = Promise<T> | T;

export interface IFlowBrickLifeCycle<V, DS, DP, CG, ST> {

    // 路径加载完成事件，对于部分组件可以在Loaded之前节流渲染，以提高效率
    onLoaded: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 组件销毁事件，注意这个事件可能发生在组件的unmounted之后，不要在里面做任何设置组件属性的值
    // 在函数里可以使用path，但无论如何Path都会被销毁
    onDispose: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 更新组件信息之前，一定会发生在数据变更的那次渲染之前
    onBeforeRefreshBrick: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 更新组件信息之后，一定会发生在数据变更的那次渲染之后，通常用于在更新组件之后处理些什么
    onAfterRefreshBrick: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 校验开始之前
    onBeforeValidate: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 校验结束后，可以处理一些什么
    onAfterValidate: (_: void, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 获取数据源之前，通常用于组件在获取数据之前添加参数
    onBeforeGetDatasource: <E>(extra: E, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<E>;

    // 获取数据源之后，通常用于在获取到数据之后，对数据进行修改，或者用于根据数据更改状态
    onAfterGetDatasource: (data: DS, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 检查当前值是否合法，这里假定DatasourceValue和BrickValue是合法的，null作为没有合法值的标识，在这里特别扩充
    onCheckValidateValue: (value: V, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<V | null>;

    // 用户输入数据变更执行前
    onBeforeChange: (value: V, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<V>;

    // 任何值变化触发
    onValueChange?: (value: V, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 用户输入数据变更执行后
    onAfterChange: (value: V, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<void>;

    // 处理捕获的错误
    onCatchErrorInfo: (info: IValidateInfo, path: IBrick<V, DS, DP, CG, ST>) => PromiseResult<string>;
}

export interface IFlowBrickRenderConfig {
    updateWhenLoading: boolean;
    updateWhenValidating: boolean;
    updateUntilReady: boolean;
}

export interface IFlowPartMapInfo {
    key: string;
    part: string;
    bricks?: IBrickDataGlobal[];
    repeat?: boolean;
    field?: string;
}

// 数据处理顺序是datasource > config > value > display > state，所以后一个在初始化成功的时候，拿不到更后边的信息
export interface IFlowBrickConfig<V, DS, DP, CG, ST> extends Partial<IFlowBrickLifeCycle<V, DS, DP, CG, ST>> {

    // 获取初始化状态（默认值）
    getInitialState(): ST;

    // 获取初始化状态（获取动态情况下的初始值）
    getDynamicInitialState(path: IBrickInstance<V, DS, DP, CG, ST>): ST;

    // 组件在任何状态下都生效的默认属性
    getDefaultValue(): V;

    // 组件的默认属性（这个值是异步的，会在config刷新之后生效）
    getDynamicDefaultValue(path: IBrickInstance<V, DS, DP, CG, ST>): V;

    // 获取静态初始化数据源
    getInitialDatasource(): DS;

    // 获取容器组件内容Board的渲染方式
    getPartBoardInfoFromBrickData(path: IBrickInstance<V, DS, DP, CG, ST>, part: string): IBoardInfo | null;

    // 获取容器组件内容Board的渲染方式
    getPartKeyMapFromBrickData?(path: IBrickInstance<V, DS, DP, CG, ST>): IFlowPartMapInfo[];

    // 获取组件用于展示的数据
    getDisplayData(path: IBrickInstance<V, DS, DP, CG, ST>): DP;

    // 获取渲染优化信息
    getRenderConfig(path: IBrickInstance<V, DS, DP, CG, ST>): IFlowBrickRenderConfig;
}

export type IFlowBrickConfigGlobal = IFlowBrickConfig<any, any, any, any, any>;
