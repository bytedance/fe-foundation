/**
 * @file digits 整数校验
 */
import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

/**
 * 数组类型
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const digits: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    if (typeof value === 'number') {
        return Math.floor(value) === value && Number.isFinite(value);
    }

    if (typeof value !== 'string' || value === '') {
        return;
    }

    return /^\d+$/.test(value);
});
