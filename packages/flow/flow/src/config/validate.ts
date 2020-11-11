/**
 * @file validate 校验规则处理
 */

import {IFlowValidateRule, IValidateConfig, ValidateRule, ValidateType} from '@chief-editor/base';
import {IValidateResult, IValidateRule, ValidateTriggerType, Validator} from '@co-hooks/validate';
import {FlowBrick} from '../lib/FlowBrick';

import {wrapFunction} from '../util/wrap';

export interface IFlowValidate {
    needValidate: boolean;
    catchable: boolean;
    func: (type: ValidateTriggerType, value: unknown, manual?: boolean) => Promise<IValidateResult>;
}

export function extractValidate<V, DS, DP, CG, ST>(
    brick: FlowBrick<V, DS, DP, CG, ST>,
    validate?: IValidateConfig
): IFlowValidate {

    const {
        catchable = false,
        needValidate = false,
        rules
    } = validate || {catchable: false, needValidate: false, rules: []};

    if (!needValidate || rules.length === 0) {

        const info = {
            partial: false,
            valid: true,
            msg: ''
        };

        return {
            needValidate,
            catchable,
            func: () => Promise.resolve(info)
        };
    }

    const validator = new Validator(brick);

    validator.updateRules(wrapValidate(brick, rules));

    return {
        needValidate: !!(validate && validate.needValidate && validate.rules.length),
        catchable: validate ? validate.catchable : false,
        func: (type, value, manual) => {
            validator.updateValue(value, manual);
            return validator.validate(type).then(() => validator.getValidateInfo());
        }
    };
}

function wrapValidate<V, DS, DP, CG, ST>(
    brick: FlowBrick<V, DS, DP, CG, ST>,
    rules: IFlowValidateRule[]
): Array<IValidateRule<FlowBrick<V, DS, DP, CG, ST>>> {

    return rules.map(rule => {

        const {
            errortip,
            trigger
        } = rule;

        // TODO 处理Watcher
        const newRule: IValidateRule<FlowBrick<V, DS, DP, CG, ST>> = {
            errorTip: errortip,
            trigger
        };

        switch (rule.rule) {
            case ValidateRule.FUNC:
                // 如果函数没传递，就不校验
                const realFn = newRule.fn ? brick.getHook(rule.func) : null;
                const fn = realFn ? realFn : () => Promise.resolve();
                newRule.fn = wrapFunction(fn, brick);
                break;
            case ValidateRule.MAX_COUNT:
                newRule.maxCount = rule.maxCount;
                break;
            case ValidateRule.MIN_COUNT:
                newRule.minCount = rule.minCount;
                break;
            case ValidateRule.MAX_LENGTH:
                newRule.maxLength = rule.maxLength;
                newRule.maxLengthType = rule.maxLengthType;
                break;
            case ValidateRule.MIN_LENGTH:
                newRule.minLength = rule.minLength;
                newRule.minLengthType = rule.minLengthType;
                break;
            case ValidateRule.REGEXP:
                newRule.regexp = rule.regexp;
                break;
            case ValidateRule.REQUIRED:
                newRule.required = true;
                break;
            case ValidateRule.TYPE:
                newRule.type = rule.type;

                if (rule.type === ValidateType.DATE) {
                    newRule.format = rule.format;
                    // newRule.locale = zhCN; todo co支持内置语言包或者
                }
        }

        return newRule;
    });
}

export function getDefaultValidate(): IFlowValidate {
    return {
        catchable: false,
        needValidate: false,
        func: () => Promise.resolve({
            partial: false,
            valid: true,
            msg: ''
        })
    };
}
