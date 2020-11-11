/**
 * @file Scheduler 调度器
 */

import {ValidateTriggerType} from '@co-hooks/validate';
import {FunctionAny} from '@co-hooks/util';
import {IBoardConfig, IBrickData, IBrickInfo, ILayoutConfig, ISetBrickDataPropertyItem} from '@chief-editor/types';
import {BaseBrick} from '../lib/BaseBrick';

export interface IBrickPartConfig extends IBoardConfig {
    key: string;
    repeat: boolean;
    field?: string;
}

export interface Scheduler<V, DS, DP, CG, ST> {

    // LifeCycle：1、初始化组件的基本信息
    initBrickData: (brick: BaseBrick<V, DS, DP, CG, ST>, data: IBrickData<V, DS, DP, CG, ST>) => IBrickInfo;

    // LifeCycle：2、初始化的同步的静态数据（用于解析同步数据，以及初始状态，以避免出现初次渲染失败的情况）
    initStaticBrickData?: () => void;

    // LifeCycle：3、Part是否是静态的，大部分组件是静态的，这里写一个函数，方便优化性能
    isPartDynamic: () => boolean;

    // LifeCycle：4、初始化Part的方法，这里设计成必传比较方便
    getPartList: () => IBrickPartConfig[];

    // LifeCycle：4、组件自身的初始化（这个函数可以是异步的，在函数内部应该更改ready事件并输出）
    init?: () => void;

    // LifeCycle：5、获取当前Brick的数据，用于编辑器渲染
    getBrickData: () => Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'>;

    // LifeCycle：6、更新组件的配置数据
    updateBrickData?: (data: Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'>) => void;

    // LifeCycle：7、设置组件布局
    setBrickLayout?: (layout: ILayoutConfig) => void;

    // LifeCycle：8、单独设置组件属性
    setBrickDataProperties?: (properties: ISetBrickDataPropertyItem[]) => boolean;

    // LifeCycle：9、销毁组件
    dispose?: () => void;

    // Event：获取数据源
    getDatasource?: (data: unknown) => void;

    // Event：分发事件
    dispatchEvent?: (name: string | Event, param?: any) => void;

    // Event：设置组件的值
    setValue?: (value: V, manual?: boolean, isSilent?: boolean) => void;

    // Event：设置状态
    setState?: (state: Partial<ST>) => void;

    // Event：校验数据合法性
    validate?: (type: ValidateTriggerType) => Promise<void>;

    // Event：获取钩子
    getHook?: (name: string) => FunctionAny | null;

    // Event：获取内置的钩子，部分组件或者插件的运行会提供内置的钩子函数
    getBuildInHooks?: () => Record<string, FunctionAny>;

    getByExpression?: (...args: Array<string | number>) => any;
}
