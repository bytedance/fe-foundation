/**
 * @file index 校验工具函数
 */

import {format} from '@co-hooks/util';
import {
    IValidateResult,
    IValidateRule,
    SyncValidateRuleFunc,
    TriggerTypeMap,
    ValidateRuleFunc,
    ValidateTriggerType
} from '../types';

// 包装同步函数，异步函数不要使用
export function wrapSyncFunc(fn: SyncValidateRuleFunc): ValidateRuleFunc {

    return (rule, value) => {

        try {

            const errorTip = rule.errorTip;
            const result = fn(rule, value);

            if (result == null) {
                return Promise.resolve();
            }

            if (typeof result === 'string') {
                return Promise.reject(format(result, rule));
            }

            return result
                ? Promise.resolve()
                : Promise.reject(
                    typeof errorTip === 'function'
                        ? errorTip(rule)
                        : typeof errorTip === 'string' ? format(errorTip, rule) : 'error'
                );
        } catch (e) {
            return Promise.reject(e.message);
        }
    };
}

const REGISTERED_TYPE_MAP: {[key: string]: ValidateRuleFunc} = {};

const REGISTERED_RULES: ValidateRuleFunc[] = [];

export function registerTypeRule(type: string, func: ValidateRuleFunc): void {
    REGISTERED_TYPE_MAP[type] = func;
}

export function registerRule(func: ValidateRuleFunc): void {
    REGISTERED_RULES.push(func);
}

export function validateRule<T>(context: T, rule: IValidateRule<T>, value: unknown): Promise<void> {

    const funcList: ValidateRuleFunc[] = REGISTERED_RULES.slice();

    const type = rule.type;

    if (type != null) {

        const func = REGISTERED_TYPE_MAP[type];

        if (func == null) {
            return Promise.reject('invalid type `' + type + '`，call `registerTypeRule` first！');
        }

        // 首先进行类型校验
        funcList.unshift(func);
    }


    return new Promise((resolve, reject) => {

        const count = funcList.length;
        let index = 0;

        const fn = (): void => {

            if (index === count) {
                resolve();
                return;
            }

            const func = funcList[index++];

            func.call(context, rule, value)
                .then(fn)
                .catch(reject);
        };

        fn();
    });
}

export function validate<T>(
    context: T,
    rules: Array<IValidateRule<T>>,
    value: unknown,
    trigger: ValidateTriggerType = 'change'
): Promise<IValidateResult> {

    const triggerLevel = TriggerTypeMap[trigger];
    const matched = rules.filter(item => TriggerTypeMap[item.trigger || 'change'] <= triggerLevel);
    const partial = matched.length < rules.length;

    return new Promise<IValidateResult>(resolve => {

        const count = matched.length;
        let index = 0;

        const fn = (): void => {

            if (index === count) {
                resolve({
                    partial,
                    valid: true,
                    msg: ''
                });
                return;
            }

            const ruleObj = matched[index++];

            validateRule(context, ruleObj, value)
                .then(fn)
                .catch((msg: string) => {
                    resolve({
                        partial,
                        valid: false,
                        msg
                    });
                });
        };

        fn();
    });
}

