/**
 * @file index 插值处理
 */

import {BindType, IBindValue} from '@chief-editor/base';
import {
    IInterpolationOptions,
    IJsonInterpolationOptions,
    transformExpression,
    transformJson
} from '@co-hooks/interpolation';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {guid} from '@co-hooks/util';
import {FlowBrickGlobal} from '../lib/FlowBrick';
import {getAbsoluteKey, getAbsoluteKeys, getRelativeKey} from './keys';

export const interpolationOptions: IInterpolationOptions = {
    symbols: [
        {
            symbol: 'models',
            direct: false,
            level: false
        },
        {
            // 当前组件的旧名字
            symbol: 'path',
            direct: true,
            level: false
        },
        {
            // 当前组件
            symbol: 'brick',
            direct: true,
            level: false
        },
        {
            // 监控当前组件的数据
            symbol: 'datasource',
            direct: true,
            level: false
        },
        {
            // 当前路径所处在的scope，比较当前的pathKey是foo.bar.baz $scope 相当于foo.bar
            // $scope2相当于foo
            symbol: 'scope',
            direct: false,
            level: true
        },
        {
            // 当前Brick所处在的Model，如果有数字，会递归向上找对应的模型，不推荐使用
            symbol: 'model',
            direct: false,
            level: true
        },
        {
            // 当前模型上的根模型
            symbol: 'root',
            direct: false,
            level: false
        },
        {
            // 当前上下文中的用户输入
            symbol: 'input',
            direct: true,
            level: false
        },
        {
            // 当前的Context
            symbol: 'context',
            direct: false,
            level: false
        },
        {
            // 全部的钩子
            symbol: 'hooks',
            direct: false,
            level: false
        }
    ],
    call: 'hooks',
    dollar: 'models',
    default: 'scope'
};

export type IWrappedInterpolationFunc = (input?: any) => any;

export interface IWrappedInterpolation {
    watchers: string[];
    func: IWrappedInterpolationFunc;
}

// 需要被包装的函数
export type INeedWrapFunction = (input: any, p: FlowBrickGlobal, ...args: any[]) => any | Promise<any>;

// 包装后的函数
export type IWrappedFunction = (...args: any[]) => Promise<any>;

/**
 * 根据路径包装一个表达式
 *
 * @param expr 要编译的表达式
 * @param brick 当前的路径
 * @return
 */
export function wrapInterpolation(expr: string, brick: FlowBrickGlobal): IWrappedInterpolation {

    try {

        const info = transformExpression(expr, interpolationOptions);
        const getByAny = (...args: string[]): any => brick.getByExpression(...args);

        const func = (input: any): any => {

            try {
                return info.func.call(null, getByAny, brick, input);
            } catch (e) {
                console.error(
                    `execute interpolation failed：
                        expr = ${expr}
                        error = ${e.message}
                        path = ${getAbsoluteKey(brick)}
                        relativePath = ${getRelativeKey(brick)}
                    `
                );
                console.error(e);
                console.error(brick);
                console.error('end execute interpolation failed');
                return null;
            }
        };

        return {
            watchers: info.watchers,
            func
        };
    } catch (e) {
        console.error(
            `compile failed：
                expr = ${expr}
                error = ${e.message}
                path = ${getAbsoluteKey(brick)}
                relativePath = ${getRelativeKey(brick)}
            `
        );
        console.error(e);
        console.error(brick);
        console.error('end compile failed：');

        return {
            watchers: [],
            func: () => null
        };
    }
}

export interface IJSONInterpolationAsyncConfig {
    watchers: string[];
    func: IWrappedFunction;
}

export interface IWrappedJSONInterpolation extends IWrappedInterpolation {
    asyncMap: Record<string, IJSONInterpolationAsyncConfig>;
}

/**
 * 根据路径将JSON数据转换成函数
 *
 * @param data 要包装的数据
 * @param brick 当前的路径
 * @return
 */
export function wrapJson(data: any, brick: FlowBrickGlobal): IWrappedJSONInterpolation {

    const asyncMap: {[key: string]: IJSONInterpolationAsyncConfig} = {};

    try {
        const jsonInterpolationOptions: IJsonInterpolationOptions<IBindValue> = {
            ...interpolationOptions,
            objectBinding: {
                key: '__bind__',
                process: (config, value) => {

                    if (config.bindType === BindType.CONST) {
                        return transformExpression(JSON.stringify(config.data), interpolationOptions);
                    }

                    if (config.bindType === BindType.EXPRESSION) {
                        return transformExpression(config.bindJs, interpolationOptions);
                    }

                    if (config.bindType === BindType.VAR) {
                        return transformExpression(config.bindKey, interpolationOptions);
                    }

                    const {func, async, watchKeys} = config;

                    if (!async) {
                        return transformExpression(`$hooks.${func}()`, interpolationOptions);
                    }

                    let fn = brick.getHook(func);
                    const id = guid();

                    if (fn == null) {
                        console.error('invalid hook func name ', func);
                        fn = () => void 0;
                    }

                    asyncMap[id] = {
                        watchers: wrapWatcher(watchKeys.split('\n'), brick),
                        func: wrapFunction(fn, brick)
                    };

                    return transformExpression(`$input['${id}']`, interpolationOptions);
                }
            }
        };

        const info = transformJson(data, jsonInterpolationOptions, []);
        const getByAny = (...args: string[]): any => brick.getByExpression(...args);

        const func = (input: any): any => {

            try {
                return info.func.call(null, getByAny, brick, input, brick.datasource);
            } catch (e) {
                console.error(
                    `execute interpolation failed：
                        data = ${JSON.stringify(data)}
                        error = ${e.message}
                        path = ${getAbsoluteKey(brick)}
                        relativePath = ${getRelativeKey(brick)}
                    `
                );
                console.error(e);
                console.error(brick);
                console.error('end execute interpolation failed');
                return null;
            }
        };

        return {
            watchers: info.watchers,
            func,
            asyncMap
        };
    } catch (e) {
        console.error(
            `compile json failed：
                data = ${JSON.stringify(data)}
                error = ${e.message}
                path = ${getAbsoluteKey(brick)}
                relativePath = ${getRelativeKey(brick)}
            `
        );
        console.error(e);
        console.error(brick);
        console.error('end compile json failed');

        return {
            watchers: [],
            func: () => null,
            asyncMap
        };
    }
}

/**
 * 根据路径包装Watcher
 *
 * @param watchers 包装前的Watchers
 * @param brick 路径
 */
export function wrapWatcher(watchers: string[], brick: FlowBrickGlobal): string[] {

    const result: string[] = [];

    let arr = watchers
        .map(item => NestWatcher.splitKey(item))
        .filter(item => item[0] !== 'hooks' && item[0] !== 'input');

    watchers.forEach(item => {

        if (/^\$/.test(item)) {
            item = item.slice(1);
        }

        const [type, ...args] = NestWatcher.splitKey(item);

        if (type === 'context') {
            return item;
        }

        if (/^scope(\d+)?/.test(type)) {
            // const level = RegExp.$1 === '' ? (brick.readonly ? 0 : 1) : +RegExp.$1;

            // 当前节点如果是Readonly
            const keys = getAbsoluteKeys(brick.getNode().parentNode || brick.getOwnerTemplate().getNode());
            return NestWatcher.combineKeys([brick.getOwnerModel().name, ...keys]);
        }

        let model = brick.getOwnerModel();

        if (/^model(\d+)?/.test(item[0])) {
            const level = +RegExp.$1 || 0;
            model = model.getParentModel(level);
        } else if (item[0] === 'root') {
            model = model.getRootModel();
        } else {
            throw new Error('unexpect type:' + item[0]);
        }

        return [model.name].concat(item.slice(1)).join('.');
    });

    return result;
}

/**
 * 包装一个函数，变成Promise
 *
 * @param func 函数
 * @param path 当前函数所属路径
 */
export function wrapFunction(func: INeedWrapFunction, path: FlowBrickGlobal): IWrappedFunction {

    return (...args: any[]) => {

        try {

            const ret = func.call(path, args[0], path, ...args.slice(1));

            if (ret != null && typeof ret === 'object' && typeof ret.then === 'function') {
                return ret;
            }

            return Promise.resolve(ret);
        } catch (e) {
            return Promise.reject(e);
        }
    };
}
