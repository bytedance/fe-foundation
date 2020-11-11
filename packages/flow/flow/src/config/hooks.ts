/**
 * @file hooks 生命周期处理
 */

import {ALL_HOOK_POS, IHookConfig} from '@chief-editor/base';
import {FunctionAny} from '@co-hooks/util';
import {FlowBrick} from '../lib/FlowBrick';
import {IFlowBrickConfig} from '../types';

export type IFlowHooksMap = Record<string, (params: unknown) => Promise<unknown>>;

export function extractHooks<V, DS, DP, CG, ST>(
    brick: FlowBrick<V, DS, DP, CG, ST>,
    config: IFlowBrickConfig<V, DS, DP, CG, ST>,
    hooks?: IHookConfig
): IFlowHooksMap {

    const hookList = hooks && hooks.hookList || [];
    const states: Record<string, FunctionAny[]> = {};
    const res: IFlowHooksMap = {};

    // 优先加载组件上的hook，这样用户可以在钩子里面操作数据
    ALL_HOOK_POS.forEach(hookPos => {

        const fn = config[hookPos];

        if (fn != null) {
            states[hookPos] = states[hookPos] || [];
            states[hookPos].push(fn);
        }
    });

    hookList.forEach(item => {
        states[item.hookPos] = states[item.hookPos] || [];

        const realFunc = brick.getHook(item.hookFun);

        if (realFunc == null) {
            console.error(`invalid hook function name = ${item.hookFun}`);
            return;
        }

        states[item.hookPos].push(realFunc);
    });

    Object.keys(states).forEach(key => {

        const list = states[key];

        res[key] = (params: unknown) => new Promise((resolve, reject) => {

            let index = 0;

            const fn = (): void => {

                if (index >= list.length) {
                    resolve(params);
                    return;
                }

                const hookFn = list[index++];

                try {

                    const ret = hookFn.call(brick, params, brick);

                    if (ret != null && typeof ret === 'object' && typeof ret.then === 'function') {

                        ret.then((v: any) => {

                            if (v !== void 0) {
                                params = v;
                            }

                            fn();
                        }).catch((e: any) => reject(e));
                        return;
                    }

                    if (ret !== void 0) {
                        params = ret;
                    }

                    fn();
                } catch (e) {
                    return reject(e.message);
                }
            };

            fn();
        });
    });

    return res;
}
