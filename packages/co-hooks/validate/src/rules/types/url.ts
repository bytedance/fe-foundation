/**
 * @file url 网址校验
 */
import {ValidateRuleFunc} from '../../types';
import {wrapSyncFunc} from '../../util';

export const url: ValidateRuleFunc = wrapSyncFunc((rule, value) => {

    if (typeof value !== 'string' || value === '') {
        return;
    }

    let reg = '^';

    if (typeof rule.protocol === 'string') {
        reg += '(?:' + rule.protocol + (!/:$/.test(rule.protocol) ? ':' : '') + ')';
    } else if (rule.protocol !== false) {
        reg += '(?:[A-Za-z]{3,9}:)' + (!rule.protocol ? '?' : '');
    }

    if (rule.slashes !== false) {
        reg += '(?:\\/\\/)' + (!rule.slashes ? '?' : '');
    }

    if (typeof rule.domain === 'string') {
        reg += '(?:' + rule.domain.replace('.', '\\.') + ')';
    } else if (rule.domain !== false) {
        reg += '(?:[A-Za-z0-9\\-]+(?:\\.[A-Za-z0-9\\-]+)+)' + (!rule.domain ? '?' : '');
    }

    if (typeof rule.port === 'number') {
        reg += `(?::${rule.port})`;
    } else if (rule.port !== false) {
        reg += '(?::(\\d{2,5}))' + (!rule.port ? '?' : '');
    }

    if (rule.pathname !== false) {
        reg += '(?:\\/[\\+~%\\/\\.\\w\\-_]*)' + (!rule.pathname ? '?' : '');
    }

    if (rule.search !== false) {
        reg += '(?:\\?(?:[-+=&;%@.\\w_]*))' + (!rule.search ? '?' : '');
    }

    if (rule.hash !== false) {
        reg += '(?:#(?:[.!\\/\\\\\\w]*))' + (!rule.hash ? '?' : '');
    }

    reg += '$';

    return new RegExp(reg).test(value);
});
