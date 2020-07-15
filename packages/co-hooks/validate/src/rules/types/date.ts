/**
 * @file date 日期类型校验
 */
import {parseDate} from '@co-hooks/util';
import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

/**
 * 日期类型
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const date: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    const {format, locale} = rule;

    if (format == null || typeof value !== 'string' || value === '') {
        return;
    }

    try {

        // 利用parse来校验
        return parseDate(value, format, locale) != null;
    } catch (e) {
        return false;
    }
});
