/**
 * @file 最小长度
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最小长度
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const minLength: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {minLength, minLengthType = 'char'} = rule;

    if (minLength == null) {
        return;
    }

    // 空值不校验长度（请使用required）
    if (typeof value === 'string' && value !== '') {

        const str: string = 'byte' === minLengthType
            ? value.replace(/[^\x00-\xff]/g, '01')
            : value;

        return str.length >= +minLength;
    }
});
