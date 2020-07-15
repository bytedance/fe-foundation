/**
 * @file 最小值
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最小值
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const min: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {min} = rule;

    if (min == null) {
        return;
    }

    if (typeof value === 'number') {
        return min <= value;
    }

    // 空值不校验大小（请使用required）
    if (typeof value === 'string' && value !== '') {
        return min <= +value;
    }
});
