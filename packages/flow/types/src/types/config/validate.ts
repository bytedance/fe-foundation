/**
 * @file validate
 */

import {ValidateTriggerType} from '@co-hooks/validate';

export interface IValidateTypeFuncRule {
    __diff_id__: string;
    rule: ValidateRule.FUNC;
    errortip: string;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    func: string;
}

export interface IValidateMaxCountRule {
    __diff_id__: string;
    rule: ValidateRule.MAX_COUNT;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    maxCount: string | number;
    errortip: string;
}

export interface IValidateMaxLengthRule {
    __diff_id__: string;
    rule: ValidateRule.MAX_LENGTH;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    maxLength: string | number;
    maxLengthType?: 'byte' | 'char';
    errortip: string;
}

export interface IValidateMinCountRule {
    __diff_id__: string;
    rule: ValidateRule.MIN_COUNT;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    minCount: string | number;
    errortip: string;
}

export interface IValidateMinLengthRule {
    __diff_id__: string;
    rule: ValidateRule.MIN_LENGTH;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    minLengthType?: 'byte' | 'char';
    minLength: string | number;
    errortip: string;
}

export interface IValidateRegexpRule {
    __diff_id__: string;
    rule: ValidateRule.REGEXP;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    regexp: string | RegExp;
    errortip: string;
}


export interface IValidateRequiredRule {
    __diff_id__: string;
    rule: ValidateRule.REQUIRED;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    errortip: string;
}

export enum ValidateType {
    ARRAY = 'array',
    EMAIL = 'email',
    URL = 'url',
    DATE = 'date',
    NUMBER = 'number',
    DIGITS = 'digits'
}

export interface IValidateTypeNormalRule {
    __diff_id__: string;
    rule: ValidateRule.TYPE;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    type: ValidateType.EMAIL | ValidateType.ARRAY | ValidateType.DIGITS | ValidateType.NUMBER;
    errortip: string;
}

export interface IValidateTypeDateRule {
    __diff_id__: string;
    rule: ValidateRule.TYPE;
    type: ValidateType.DATE;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    errortip: string;
    format: string;
}

export interface IValidateTypeUrlRule {
    __diff_id__: string;
    rule: ValidateRule.TYPE;
    trigger: Exclude<ValidateTriggerType, 'reset'>;
    type: ValidateType.URL;
    errortip: string;
}

export type IValidateTypeRule = IValidateTypeUrlRule | IValidateTypeNormalRule | IValidateTypeDateRule;


export type IFlowValidateRule =
    IValidateTypeRule
    | IValidateMinLengthRule
    | IValidateRequiredRule
    | IValidateRegexpRule
    | IValidateMaxCountRule
    | IValidateMaxLengthRule
    | IValidateTypeFuncRule
    | IValidateMinCountRule;

export enum ValidateRule {
    TYPE = 'type',
    MAX_COUNT = 'maxCount',
    MIN_COUNT = 'minCount',
    MAX_LENGTH = 'maxLength',
    MIN_LENGTH = 'minLength',
    REGEXP = 'regexp',
    REQUIRED = 'required',
    FUNC = 'func'
}

export interface IValidateConfig {

    // 是否可以捕获
    catchable: boolean;

    // 是否需要校验
    needValidate: boolean;

    // 校验规则
    rules: IFlowValidateRule[];
}
