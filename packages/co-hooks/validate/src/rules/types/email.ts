/**
 * @file email 邮箱验证
 */
import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

const w3cEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * 邮箱验证
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const email: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    if (typeof value !== 'string' || value === '') {
        return;
    }

    return w3cEmail.test(value);
});
