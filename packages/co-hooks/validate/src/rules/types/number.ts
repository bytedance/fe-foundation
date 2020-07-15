/**
 * @file number 数字验证
 */
import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

/**
 * 数字验证
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const number: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (typeof value !== 'string' || value === '') {
        return;
    }

    return Number.isFinite(+value);
});
