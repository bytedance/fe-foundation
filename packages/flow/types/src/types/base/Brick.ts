/**
 * @file Brick 组件相关类型
 */
import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {FunctionAny} from '@co-hooks/util';
import {IStyleConfig} from '../config/style';
import {ILayoutConfig} from '../config/layout';
import {IDatasourceConfig} from '../config/datasource';
import {IWatcherConfig} from '../config/watcher';
import {IHookConfig} from '../config/hooks';
import {IEventConfig} from '../config/events';
import {IValidateConfig} from '../config/validate';
import {BoardType, INodeType} from './Node';
import {IBoardData} from './Board';

export interface IBrickEvent {
    'repaint': [];
    'active-change': [boolean];
    'lock-change': [boolean];
}

export interface IBrickData<V, DS, DP, CG, ST> {

    // 配置的唯一ID
    id?: string;

    // 组件的类型
    type: string;

    config: CG;

    info: {

        // Brick内置ID用于在运行时快速获取一些核心Brick
        id: string;

        // 字段名（用于标记一个Brick在数据流中的位置和价值，没有filed的Brick仅用于展现）
        field: string;

        // 图层名，用于在图层面板中使用（不要用label来显示组件，info里面的内容不能被绑定）
        label: string;

        // 图层是否加锁
        lock?: boolean;

        // 扩展属性，用于给组件配置上添加静态属性，可以用来以JSON形式写组件。
        expandProps: Partial<CG> & {styles?: IStyleConfig};
    };

    // 非布局样式
    styles?: IStyleConfig;

    // 组件的布局属性
    layout?: ILayoutConfig;

    // 组件的数据源
    datasource?: IDatasourceConfig<V, DS>;

    // 监控字段
    watchers?: IWatcherConfig;

    // 钩子信息
    hooks?: IHookConfig;

    // 组件的事件
    events?: IEventConfig;

    // 组件的校验信息
    validate?: IValidateConfig;

    // part配置
    parts?: {[key: string]: IBoardData};
}

export type IBrickDataGlobal = IBrickData<any, any, any, any, any>;

export interface IValidateInfo {

    // 当前元素是否捕获错误
    catchable: boolean;

    // 当前Brick是否校验
    needValidate: boolean;

    // 是否是部分校验成功
    partial: boolean;

    // 当前校验是否成功
    valid: boolean;

    // 当前的错误提示
    error: string;

    // 子Brick的校验信息
    children: IValidateInfo[];
}

export type BrickEnv = 'editor' | 'preview' | 'flow';

export interface IBrickInfo {

    // 用于检索元素的Id，可能重复，但是重复只能获取到第一条
    readonly id: string;

    // Brick的类型，用于标记一个Brick
    readonly brickType: string;

    // Brick的本征Id，用于在Watcher里面标记一个Brick等，全局唯一
    readonly creator: string;

    // Brick的描述性标签，通常是图层名字
    readonly label: string;

    // Brick的字段名，用于匹配Model中的数据
    readonly field: string;

    // 是否只读，只读的Brick
    readonly readonly: boolean;

    // 运行环境
    readonly env: BrickEnv;

    // 是否需要虚拟化父级
    readonly virtual: boolean;

    // 是否加锁
    readonly lock: boolean;
}

export interface IBrickInstance<V, DS, DP, CG, ST> extends IBrickInfo {

    // 当前值，任何Brick都应当有值，如果没有，请传递V = null
    readonly value: V;

    // 当前生效的数据源，任何Brick都应当有数据源，如果没有，请传递DS = null
    readonly datasource: DS;

    // 静态数据源，某些Tab类
    // 条件类Brick需要提前知道Brick的数据那就需要在这里面配置好数据全集
    readonly staticDatasource: DS;

    // Brick对外输入的文字版本该要，这个值需要易于显示
    readonly display: DP;

    // Brick的配置信息
    readonly config: CG;

    // Brick的状态配置
    readonly state: ST;

    // 非布局样式
    readonly styles?: IStyleConfig;

    // 布局
    readonly layout: ILayoutConfig;

    // 表单校验信息
    readonly validateInfo: IValidateInfo;

    // Brick的状态 - 加载中，用于标记是否在加载数据源
    readonly loading: boolean;

    // Brick的状态 - 校验中，用于标记是否在校验数据
    readonly validating: boolean;

    // Brick状态 - 用户是否输入过，如果没输入过，或者重置了，则不进行任何表单校验
    readonly manual: boolean;

    // 初始化是否完成
    readonly ready: boolean;

    // 是否加锁
    readonly lock: boolean;
}

// 基础模型
export interface IBrick<V, DS, DP, CG, ST> extends IBrickInstance<V, DS, DP, CG, ST>, Emitter<IBrickEvent> {

    /**
     * 设置当前值
     *
     * @param value 要设置的值
     * @param manual 是否用户行为
     * @param isSilent 是否静默设置
     */
    setValue(value: V, manual?: boolean, isSilent?: boolean): void;

    /**
     * 设置组件的state状态
     *
     * @param state 状态值
     */
    setState(state: Partial<Record<keyof ST, any>>): void;

    /**
     * 更新数据源
     *
     */
    getDatasource(data: unknown): void;

    /**
     * 触发事件
     *
     * @param e 事件对象
     */
    dispatchEvent(e: Event): void;

    /**
     * 触发事件
     *
     * @param name 事件名称
     * @param param 参数
     */
    dispatchEvent(name: string, param?: any): void;

    /**
     * 用于获取一份路径实例信息
     *
     * @return 返回只读的实例信息
     */
    getInstance(): Readonly<IBrickInstance<V, DS, DP, CG, ST>>;

    /**
     * 获取Part的配置
     *
     * @param name Part的名字
     * @return 返回part的配置数组
     */
    getPart(name: string): DomNode<INodeType> | null;

    /**
     * 获取一个钩子
     *
     * @param name 名称
     */
    getHook(name: string): FunctionAny | null;

    /**
     * 获取Node节点
     *
     * @return 所属Node节点
     */
    getNode(): DomNode<INodeType>;

    /**
     * 是否在浮动面板里面
     *
     */
    getBoardType(): BoardType;

    /**
     * 是否在浮动面板里面
     *
     */
    isFloat(): boolean;

    /**
     * 获取组件的当前配置数据
     *
     * @return 返回配置数据的原始值
     */
    getBrickData(cleanId?: boolean): IBrickData<V, DS, DP, CG, ST>;


    /**
     * 表达式获取内容
     *
     * @param expression
     */
    getByExpression(...expression: Array<string | number>): any;

    /**
     * 销毁组件
     *
     */
    dispose(): void;
}

export type IBrickGlobal = IBrick<any, any, any, any, any>;

export interface ISetBrickDataPropertyItem {
    path: string;
    value: any;
}
