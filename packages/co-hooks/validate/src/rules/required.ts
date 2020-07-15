/**
 * @file 必填
 */
import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 必填
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const required: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {required} = rule;

    if (required == null) {
        return;
    }

    return Boolean(Array.isArray(value) && value.length)
        || !Array.isArray(value) && value != null && value !== '';
});
