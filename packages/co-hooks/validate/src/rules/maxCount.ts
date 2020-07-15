/**
 * @file 最大个数
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最大个数
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const maxCount: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {maxCount} = rule;

    if (maxCount == null) {
        return;
    }

    // 空值不校验长度（请使用required），请用type = array
    if (Array.isArray(value) && value.length) {
        return value.length <= +maxCount;
    }
});
