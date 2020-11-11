/**
 * @file hook 钩子定义
 */
import {tuple} from '@co-hooks/util';

// 钩子的位置
export const ALL_HOOK_POS = tuple(

    // 路径加载完成事件，对于部分组件可以在Loaded之前节流渲染，以提高效率
    'onLoaded',

    // 组件销毁事件，注意这个事件可能发生在组件的unmounted之后，不要在里面做任何设置组件属性的值
    // 在函数里可以使用path，但无论如何Path都会被销毁
    'onDispose',

    // 更新组件信息之前，一定会发生在数据变更的那次渲染之前
    // 函数会传递给组件id, field, readonly, config, datasource的信息
    // 这些信息是被克隆的，所以你可以任意修改里面的数据，但是不会影响path
    'onBeforeRefreshBrick',

    // 更新组件信息之后，一定会发生在数据变更的那次渲染之后
    // 通常用于在更新组件之后处理些什么
    'onAfterRefreshBrick',

    // 校验开始之前，如果返回ret === false，则不进行这一次校验
    // 如果要更改校验，请手工调用setValidate方法
    // 函数的形式是(_: null, path: Path) => false | void
    // 注意不能用0，""等表示false，请传递字面量
    'onBeforeValidate',

    // 校验结束后，可以处理一些什么
    'onAfterValidate',

    // 获取数据源之前
    // 通常用于组件在获取数据之前修改参数
    // 函数的形式是(extra: any, path: Path) => any
    'onBeforeGetDatasource',

    // 获取数据源之后
    // 通常用于在获取到数据之后，对数据进行修改，或者用于根据数据更改状态
    // 函数的形式是(data: any, path: Path) => any
    'onAfterGetDatasource',

    // 检查当前值是否合法，这里假定datasourceValue和brickValue是合法的
    'onCheckValidateValue',

    // 用户输入数据变更执行前
    'onBeforeChange',

    // 用户输入数据变更执行后
    'onAfterChange',

    // 任何值变化触发
    'onValueChange',

    // 是否要捕获错误
    // 函数会传入一个校验对象
    'onCatchErrorInfo'
);

export interface IHookItemConfig {

    __diff_id__: string;

    // 钩子的位置
    hookPos: string;

    // 绑定的函数名字
    hookFun: string;
}

export interface IHookConfig {
    hookList: IHookItemConfig[];
}
