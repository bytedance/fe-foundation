/**
 * @file required 必填校验
 */
import {validateRule} from '../';
import {TEST_USED_LOCALE} from '../../util/test/config';

enum ValidateType {
    ARRAY = 'array',
    EMAIL = 'email',
    URL = 'url',
    DATE = 'date',
    NUMBER = 'number',
    DIGITS = 'digits'
}

describe('validate', () => {

    describe('required', () => {

        const rule: IValidateRule = {
            required: true,
            errorTip: 'mock'
        };

        it('test valid', () => expect(validateRule(rule, 'foo')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '')).rejects.toBe('mock'));

        it('test valid arr', () => expect(validateRule(rule, ['foo'])).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, [])).rejects.toBe('mock'));
    });

    describe('minCount', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            minCount: 2
        };

        it('test valid', () => expect(validateRule(rule, [1, 2])).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, [1, 2, 3])).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, [1])).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());
    });

    describe('maxCount', () => {

        const rule: IValidateRule = {

            errorTip: 'mock',
            maxCount: 2
        };

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, [1])).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, [1, 2])).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, [1, 2, 3])).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, [1, 2, 3, 4])).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());
    });

    describe('minLength', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            minLength: 2
        };

        it('test valid', () => expect(validateRule(rule, '12')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '123')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '1')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());
    });

    describe('maxLength', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            maxLength: 2
        };

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '1')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '12')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '123')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '1234')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());
    });

    describe('minLength byte', () => {

        const rule: IValidateRule = {

            errorTip: 'mock',
            minLengthType: 'byte',
            minLength: 2
        };

        it('test valid', () => expect(validateRule(rule, '12')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '我')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '1')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());
    });

    describe('maxLength byte', () => {

        const rule: IValidateRule = {

            errorTip: 'mock',
            maxLengthType: 'byte',
            maxLength: 2
        };

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '1')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '12')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '我1')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '我是')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());
    });

    describe('regexp string', () => {

        const rule: IValidateRule = {

            errorTip: 'mock',
            regexp: '^\\d+$'
        };
        it('test valid', () => expect(validateRule(rule, '123')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a123')).rejects.toBe('mock'));

        it('test skip', () => expect(validateRule(rule, '')).resolves.toBeUndefined());
    });

    describe('regexp reg', () => {

        const rule: IValidateRule = {

            errorTip: 'mock',
            regexp: /^\d+$/
        };
        it('test valid', () => expect(validateRule(rule, '123')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a123')).rejects.toBe('mock'));

        it('test skip', () => expect(validateRule(rule, '')).resolves.toBeUndefined());
    });

    describe('types ARRAY', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.ARRAY
        };

        it('test valid', () => expect(validateRule(rule, [])).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a123')).rejects.toBe('mock'));
    });

    describe('types number', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.NUMBER
        };

        it('test valid', () => expect(validateRule(rule, 123)).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 123.1)).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, -123.1)).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '123')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '123.1')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '-123.1')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, '-123.1e3')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '1a')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, NaN)).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, Infinity)).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, -Infinity)).rejects.toBe('mock'));
    });

    describe('types digits', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.DIGITS
        };

        it('test valid', () => expect(validateRule(rule, 123)).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 123.1)).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, '123')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, -123.1)).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '123.1')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '-123.1')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '-123.1e3')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '1a')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, NaN)).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, Infinity)).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, -Infinity)).rejects.toBe('mock'));
    });

    describe('type email', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.EMAIL
        };

        it('test valid', () => expect(validateRule(rule, '123@a.com')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a123')).rejects.toBe('mock'));
    });

    describe('type url protocol true', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true
        };

        it('test valid', () => expect(validateRule(rule, 'http:')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https:')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'aaaaaaaaa:')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a:')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'aa:')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'httphttphttphttp:')).rejects.toBe('mock'));
    });

    describe('type url protocol false', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: false,
            slashes: false,
            domain: false
        };

        it('test valid', () => expect(validateRule(rule, '')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'https:')).rejects.toBe('mock'));
    });

    describe('type url protocol string', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: 'https?',
            slashes: false,
            domain: false
        };

        it('test valid', () => expect(validateRule(rule, 'http:')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https:')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'ftp:')).rejects.toBe('mock'));
    });

    describe('type url protocol string2', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: 'https?:',
            slashes: false,
            domain: false
        };

        it('test valid', () => expect(validateRule(rule, 'http:')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https:')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'ftp:')).rejects.toBe('mock'));
    });

    describe('type url slashes', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: false
        };

        it('test valid', () => expect(validateRule(rule, 'http://')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https://')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'aaaaaaaaa://')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'a://')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'aa://')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http:')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, ':')).rejects.toBe('mock'));
    });

    describe('type url domain true', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: true
        };

        it('test valid', () => expect(validateRule(rule, 'http://aaa.com')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https://bbb.com')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https://aaa.bbb.com.cn')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'https://aa')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'https://aa..bb')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'https://.bb')).rejects.toBe('mock'));
    });

    describe('type url domain false', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: false
        };

        it('test valid', () => expect(validateRule(rule, 'http://')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'https://aa.com')).rejects.toBe('mock'));
    });

    describe('type url domain string', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: 'http:',
            slashes: true,
            domain: 'rc.com'
        };

        it('test valid', () => expect(validateRule(rule, 'http://rc.com')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'https://aaa.rc.com')).rejects.toBe('mock'));
    });

    describe('type url port true', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: true
        };

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, 'http://rc.com:123')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com:23')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com:2344')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com:23445')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com:')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com:1')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com:1234567')).rejects.toBe('mock'));
    });

    describe('type url port false', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: false
        };

        it('test valid', () => expect(validateRule(rule, 'http://rc.com')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com:123')).rejects.toBe('mock'));
    });

    describe('type url port number', () => {

        const rule: IValidateRule = {


            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: 1234
        };

        it('test valid', () => expect(validateRule(rule, 'http://rc.com:1234')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com:1235')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com')).rejects.toBe('mock'));
    });

    describe('type url other true', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: false,
            pathname: true,
            search: true,
            hash: true
        };

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com/a/b')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com/a/b?a')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b?a#b')).resolves.toBeUndefined());
    });


    describe('type url other true', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: false,
            pathname: true
        };

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b?a')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b?a#b')).resolves.toBeUndefined());
    });


    describe('type url other true', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.URL,
            protocol: true,
            slashes: true,
            domain: 'rc.com',
            port: false,
            pathname: true,
            search: true
        };

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'http://rc.com/a/b')).rejects.toBe('mock'));

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b?a')).resolves.toBeUndefined());

        it('test valid', () => expect(validateRule(rule, 'http://rc.com/a/b?a#b')).resolves.toBeUndefined());
    });

    describe('type date', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.DATE,
            format: 'YYYY-MM-DD',
            locale: TEST_USED_LOCALE
        };

        it('test valid', () => expect(validateRule(rule, '2012-11-11')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '201-11-22')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '201-1-2')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '201-1)2')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '201-1)2')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'a201-12-12')).rejects.toBe('mock'));
    });

    describe('type date 2', () => {

        const rule: IValidateRule = {
            errorTip: 'mock',
            type: ValidateType.DATE,
            format: 'YYYY-M-D',
            locale: TEST_USED_LOCALE
        };

        it('test valid', () => expect(validateRule(rule, '2012-11-11')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '201-11-22')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '2011-1-2')).resolves.toBeUndefined());

        it('test invalid', () => expect(validateRule(rule, '201-1)2')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, '201-1)2')).rejects.toBe('mock'));

        it('test invalid', () => expect(validateRule(rule, 'a201-12-12')).rejects.toBe('mock'));
    });

    describe('func', () => {

        it('test valid', () => {

            expect.assertions(2);

            const fn = (value: string): Promise<void> => {
                expect(value).toBe('foo');
                return Promise.resolve();
            };

            const rule: IValidateRule = {

                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).resolves.toBeUndefined();
        });

        it('test invalid', () => {

            expect.assertions(2);

            const fn = (value: string): Promise<void> => {
                expect(value).toBe('foo');
                return Promise.reject('aaa');
            };

            const rule: IValidateRule = {

                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).rejects.toBe('aaa');
        });

        it('test invalid2', () => {

            expect.assertions(2);

            const fn = (value: string): Promise<void> => {
                expect(value).toBe('foo');
                return Promise.reject(null);
            };

            const rule: IValidateRule = {
                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).rejects.toBe('mock');
        });

        it('test invalid3', () => {

            expect.assertions(2);

            const fn = (value: string): Promise<void> => {
                expect(value).toBe('foo');
                return Promise.reject();
            };

            const rule: IValidateRule = {

                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).rejects.toBe('mock');
        });

        it('test invalid4', () => {

            expect.assertions(2);

            const fn = (value: string): Promise<void> => {
                expect(value).toBe('foo');
                return Promise.reject(new Error('bar'));
            };

            const rule: IValidateRule = {
                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).rejects.toBe('bar');
        });

        it('test valid', () => {

            expect.assertions(2);

            const fn = (value: string): void => {
                expect(value).toBe('foo');
            };

            const rule: IValidateRule = {
                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).resolves.toBeUndefined();
        });

        it('test invalid', () => {

            expect.assertions(2);

            const fn = (value: string): void => {
                expect(value).toBe('foo');
                throw new Error('aaa');
            };

            const rule: IValidateRule = {

                fn,
                errorTip: 'mock'
            };

            return expect(validateRule(rule, 'foo')).rejects.toBe('aaa');
        });
    });

    describe('invalid type', () => {

        const rule = {
            errorTip: 'mock',
            type: 'noexist'
        };

        it('test invalid', () => expect(validateRule(rule, 'foo')).rejects
            .toBe('invalid type `noexist`，call `registerTypeRule` first！'));
    });
});
