/**
 * @file 类型校验
 */
import {func} from './rules/func';
import {min} from './rules/min';
import {max} from './rules/max';
import {maxCount} from './rules/maxCount';
import {maxLength} from './rules/maxLength';
import {minCount} from './rules/minCount';
import {minLength} from './rules/minLength';
import {regexp} from './rules/regexp';
import {required} from './rules/required';
import {array} from './rules/types/array';
import {date} from './rules/types/date';
import {digits} from './rules/types/digits';
import {email} from './rules/types/email';
import {number} from './rules/types/number';
import {url} from './rules/types/url';
import {registerRule, registerTypeRule, validate} from './util';

export {
    ValidateErrorTipFunc,
    ValidateRuleFunc,
    SyncValidateRuleFunc,
    ValidateTriggerType,
    IValidateResult,
    IValidateRule
} from './types';

export {Validator} from './lib/Validator';

export {
    registerTypeRule,
    registerRule,
    validate
};

export {
    func,
    min,
    max,
    maxCount,
    maxLength,
    minCount,
    minLength,
    regexp,
    required,
    array,
    date,
    digits,
    email,
    number,
    url
};

registerRule(required);
registerRule(min);
registerRule(max);
registerRule(maxLength);
registerRule(minLength);
registerRule(regexp);
registerRule(maxCount);
registerRule(minCount);
registerRule(func);

registerTypeRule('array', array);
registerTypeRule('date', date);
registerTypeRule('digits', digits);
registerTypeRule('email', email);
registerTypeRule('number', number);
registerTypeRule('url', url);

