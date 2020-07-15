/**
 * @file 最大长度
 */

import {ValidateRuleFunc} from '../types';
import {wrapSyncFunc} from '../util';

/**
 * 最大长度
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const maxLength: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {maxLength, maxLengthType = 'char'} = rule;

    if (maxLength == null) {
        return;
    }

    // 空值不校验长度（请使用required）
    if (typeof value === 'string' && value !== '') {

        const str: string = 'byte' === maxLengthType
            ? value.replace(/[^\x00-\xff]/g, '01')
            : value;

        return str.length <= +maxLength;
    }
});
