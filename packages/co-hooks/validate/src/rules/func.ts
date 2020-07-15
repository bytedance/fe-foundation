/**
 * @file 自定义校验
 */

import {format} from '@co-hooks/util';
import {IValidateRule} from '../types';

/**
 * 类型校验
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export function func<T>(this: T, rule: IValidateRule<T>, value: unknown): Promise<void> {

    const {fn, errorTip} = rule;

    if (fn == null) {
        return Promise.resolve();
    }

    try {

        const result = fn(value, this);

        if (result != null && typeof result === 'object' && typeof result.then === 'function') {

            return result.catch((e: Error | string) => {

                const str = e == null || typeof e === 'string' ? e || '' : e.message;

                if (str) {
                    return Promise.reject(format(str, rule));
                }

                return Promise.reject(
                    typeof errorTip === 'function'
                        ? errorTip(rule)
                        : typeof errorTip === 'string' ? format(errorTip, rule) : 'error'
                );
            });
        }

        return Promise.resolve();
    } catch (e) {
        return Promise.reject(e.message);
    }
}
