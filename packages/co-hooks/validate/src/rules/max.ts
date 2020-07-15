/**
 * @file 最大值
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最大值
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const max: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {max} = rule;

    if (max == null) {
        return;
    }

    if (typeof value === 'number') {
        return max >= value;
    }

    // 空值不校验大小（请使用required）
    if (typeof value === 'string' && value !== '') {
        return max >= +value;
    }
});
