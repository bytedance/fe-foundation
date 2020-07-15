/**
 * @file array 数组校验
 */

import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

/**
 * 数组类型
 *
 * @param rule 校验信息
 * @param value 被校验数据
 */
export const array: ValidateRuleFunc = wrapSyncFunc((rule, value) => Array.isArray(value));
