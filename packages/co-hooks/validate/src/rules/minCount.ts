/**
 * @file 最小个数
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最小个数
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const minCount: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {minCount} = rule;

    if (minCount == null) {
        return;
    }

    // 空值不校验长度（请使用required），请用type = array
    if (Array.isArray(value) && value.length) {
        return value.length >= +minCount;
    }
});
