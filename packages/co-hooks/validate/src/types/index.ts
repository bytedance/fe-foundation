/**
 * @file index.ts
 */
import {IDateLocale, tuple} from '@co-hooks/util';

export type ValidateErrorTipFunc = (rule: IValidateRuleInfo) => Promise<string>;

export type ValidateRuleFunc = (rule: IValidateRuleInfo, value: unknown) => Promise<void>;

export type SyncValidateRuleFunc = (rule: IValidateRuleInfo, value: unknown) => boolean | string | void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IValidateFunc<T> = (value: any, context: T) => void | Promise<void>;

export const TriggerType = tuple('reset', 'change', 'blur', 'manual', 'force');

export const TriggerTypeMap = TriggerType.reduce<Record<string, number>>((map, item, index) => {
    map[item] = index;
    return map;
}, {});

// 校验的触发方式
export type ValidateTriggerType = (typeof TriggerType)[number];

export interface IValidateResult {
    partial: boolean;
    valid: boolean;
    msg: string;
}

export interface IValidateRuleInfo {
    type?: string;
    errorTip?: string | ValidateErrorTipFunc;
    label?: string;
    format?: string;
    max?: string | number;
    maxCount?: string | number;
    maxLength?: string | number;
    maxLengthType?: 'byte' | 'char';
    minLength?: string | number;
    minLengthType?: 'byte' | 'char';
    min?: string | number;
    minCount?: string | number;
    regexp?: string | RegExp;
    required?: boolean;
    locale?: IDateLocale;
    // 是否有协议，true表示一定有，false表示一定没有，不传递可选，传递字符串强匹配
    protocol?: boolean | string;

    // 是否有双斜线，true表示一定有，false表示一定没有，不传递可选
    slashes?: boolean;

    // 是否有主域，true表示一定有，false表示一定没有，不传递可选，传递字符串强匹配
    domain?: boolean | string;

    // 是否有端口，true表示一定有，false表示一定没有，不传递可选，传递数字强匹配
    port?: boolean | number;

    // 是否有path，true表示一定有，false表示一定没有，不传递可选
    pathname?: boolean;

    // 是否有query，true表示一定有，false表示一定没有，不传递可选
    search?: boolean;

    // 是否有hash，true表示一定有，false表示一定没有，不传递可选
    hash?: boolean;
}

export interface IValidateRule<T> extends IValidateRuleInfo {
    trigger?: Exclude<ValidateTriggerType, 'reset'>;
    fn?: IValidateFunc<T>;
}
