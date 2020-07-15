/**
 * @file 规则校验
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 规则校验
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const regexp: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {regexp} = rule;

    if (regexp == null) {
        return;
    }

    // 空值不校验长度（请使用required）
    if (typeof value === 'string' && value !== '') {

        const reg = typeof regexp === 'string'
            ? new RegExp(regexp)
            : regexp;

        return reg.test(value);
    }
});
