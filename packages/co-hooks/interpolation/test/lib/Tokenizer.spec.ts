/**
 * @file Tokenizer.spec
 */

import {SUPPORT_OPERATORS, TokenType, Tokenizer, UNSUPPORTED_OPERATORS} from '../../src';

describe('Tokenizer test', () => {

    it('TokenType', () => {

        expect(TokenType.REGEXP).toBe('regexp');
        expect(TokenType.OPERATOR).toBe('operator');
        expect(TokenType.KEYWORD).toBe('keyword');
        expect(TokenType.ATOM).toBe('atom');
        expect(TokenType.NAME).toBe('name');
        expect(TokenType.PUNC).toBe('punc');
        expect(TokenType.NUM).toBe('num');
        expect(TokenType.STRING).toBe('string');
    });

    describe('Tokenizer constructor test', () => {

        it('测试空字符串', () => {

            const token: any = new Tokenizer('');
            expect(token.expr).toBe('');
        });

        it('测试\\r换行符号', () => {

            const token: any = new Tokenizer('\r');
            expect(token.expr).toBe(' ');
        });

        it('测试\\n换行符号', () => {

            const token: any = new Tokenizer('\n');
            expect(token.expr).toBe(' ');
        });

        it('测试\\r\\n换行符号', () => {

            const token: any = new Tokenizer('\r\n');
            expect(token.expr).toBe('  ');
        });

        it('测试\\t', () => {

            const token: any = new Tokenizer('\t');
            expect(token.expr).toBe(' ');
        });

        it('测试\\f换行符号', () => {

            const token: any = new Tokenizer('\f');
            expect(token.expr).toBe(' ');
        });
    });

    describe('Tokenizer space', () => {

        it('space eof', () => {
            const token = new Tokenizer('\r\n ');
            expect(token.nextToken().type).toBe(TokenType.EOF);
        });

        it('space num', () => {
            const token = new Tokenizer('\r\n 123 ');
            expect(token.nextToken().type).toBe(TokenType.NUM);
        });

        it('space string', () => {
            const token = new Tokenizer('\r\n "12 3" ');
            const {type, value} = token.nextToken();
            expect(type).toBe(TokenType.STRING);
            expect(value).toBe('12 3');
        });
    });

    describe('Tokenizer number literal test', () => {

        it.each([
            ['1', 1],
            ['012', 10],
            ['0x12', 18],
            ['0X12', 18],
            ['0xA', 10],
            ['0XB', 11],
            ['0xC', 12],
            ['0XD', 13],
            ['0xE', 14],
            ['0XF', 15],
            ['0xa', 10],
            ['0xb', 11],
            ['0xc', 12],
            ['0xd', 13],
            ['0xe', 14],
            ['0xf', 15],
            ['.5', 0.5],
            ['0.1e3', 100],
            ['1000e-3', 1],
            ['0.1E3', 100],
            ['0.1E+3', 100],
            ['1000E-3', 1]
        ])(
            'test parse token %i',
            (a, expected) => {

                const tokenizer = new Tokenizer(a.toString());
                const token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.NUM);
                expect(token.value).toBe(expected);
                expect(token.raw).toBe(a);

                const nextToken = tokenizer.nextToken();
                expect(nextToken.type).toBe(TokenType.EOF);
            }
        );

        it('number literal with multiple x', () => {

            const tokenizer = new Tokenizer('0x1x');
            const token = tokenizer.nextToken();

            expect(token.type).toBe(TokenType.NUM);
            expect(token.value).toBe(1);
            expect(token.raw).toBe('0x1');

            const nextToken = tokenizer.nextToken();
            expect(nextToken.type).toBe(TokenType.NAME);
            expect(nextToken.value).toBe('x');
            expect(nextToken.raw).toBe('x');

            const nextToken2 = tokenizer.nextToken();
            expect(nextToken2.type).toBe(TokenType.EOF);
        });

        it('number literal with multiple e', () => {

            const tokenizer = new Tokenizer('1E3E');
            const token = tokenizer.nextToken();

            expect(token.type).toBe(TokenType.NUM);
            expect(token.value).toBe(1000);
            expect(token.raw).toBe('1E3');

            const nextToken = tokenizer.nextToken();
            expect(nextToken.type).toBe(TokenType.NAME);
            expect(nextToken.value).toBe('E');
            expect(nextToken.raw).toBe('E');

            const nextToken2 = tokenizer.nextToken();
            expect(nextToken2.type).toBe(TokenType.EOF);
        });

        it('number literal with multiple .', () => {

            const tokenizer = new Tokenizer('1.1.');
            const token = tokenizer.nextToken();

            expect(token.type).toBe(TokenType.NUM);
            expect(token.value).toBe(1.1);
            expect(token.raw).toBe('1.1');

            const nextToken = tokenizer.nextToken();
            expect(nextToken.type).toBe(TokenType.PUNC);
            expect(nextToken.value).toBe('.');
            expect(nextToken.raw).toBe('.');

            const nextToken2 = tokenizer.nextToken();
            expect(nextToken2.type).toBe(TokenType.EOF);
        });

        it('number literal with . after e', () => {

            const tokenizer = new Tokenizer('1e.3');

            expect(() => {
                tokenizer.nextToken();
            }).toThrow(/Invalid syntax/);
        });
    });

    describe('Tokenizer string literal test', () => {

        it.each([
            ['\'\'', ''],
            ['\'1abc\'', '1abc'],
            ['\'\\n\'', '\n'],
            ['\'\\r\'', '\r'],
            ['\'\\t\'', '\t'],
            ['\'\\b\'', '\b'],
            ['\'\\f\'', '\f'],
            ['\'\\v\'', '\u000b'],
            ['\'\\x25\'', '%'],
            ['\'\\u0025\'', '%'],
            ['\'\\045\'', '%'],
            ['\'\\d\'', 'd'],
            ['\'\\\\\'', '\\'],
            ['\'\\"\'', '"'],
            ['\'\\\'\'', '\''],
            ['\'\\0\'', '\0'],
            ['\' \'', ' ']
        ])(
            'test parse token %s',
            (a, expected) => {

                const tokenizer = new Tokenizer(a);
                const token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.STRING);
                expect(token.value).toBe(expected);
                expect(token.raw).toBe(a);

                const nextToken = tokenizer.nextToken();
                expect(nextToken.type).toBe(TokenType.EOF);
            }
        );

        it('string literal with error escape x', () => {

            const tokenizer = new Tokenizer('"\\xgh"');

            expect(() => {
                tokenizer.nextToken();
            }).toThrow(/Invalid hex-character/);
        });

        it('string literal with error escape u', () => {

            const tokenizer = new Tokenizer('"\\uvw"');

            expect(() => {
                tokenizer.nextToken();
            }).toThrow(/Invalid hex-character/);
        });

        it('string literal with error eof', () => {

            const tokenizer = new Tokenizer('"abc');

            expect(() => {
                tokenizer.nextToken();
            }).toThrow(/Invalid end of expr/);
        });
    });

    describe('Tokenizer regexp literal test', () => {

        it.each([
            ['/foo/g', /foo/g],
            ['/[abc]/g', /[abc]/g],
            ['/(aaa|bbb)/g', /(aaa|bbb)/g],
            ['/[\\r\\t\\f\\b]/g', /[\r\t\f\b]/g]
        ])(
            'test parse token %s',
            (a, expected) => {

                const tokenizer = new Tokenizer(a.toString());
                const token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.REGEXP);
                expect(token.value.toString()).toBe(expected.toString());
                expect(token.raw).toBe(a);

                const nextToken = tokenizer.nextToken();
                expect(nextToken.type).toBe(TokenType.EOF);
            }
        );
    });

    describe('Tokenizer op test', () => {

        const supportOperator = [
            'in',
            'typeof',
            'void',
            '+',
            '-',
            '!',
            '|',
            '*',
            '/',
            '%',
            '<',
            '>',
            '<=',
            '>=',
            '==',
            '===',
            '!=',
            '!==',
            '?',
            '&&',
            '||'
        ];

        const unsupportedOperator = [
            'instanceof',
            'new',
            'delete',
            '++',
            '--',
            '~',
            '&',
            '^',
            '>>',
            '<<',
            '>>>',
            '=',
            '+=',
            '-=',
            '/=',
            '*=',
            '%=',
            '>>=',
            '<<=',
            '>>>=',
            '|=',
            '^=',
            '&='
        ];

        it('operator valid测试', () => {
            expect(Object.keys(SUPPORT_OPERATORS).length).toBe(supportOperator.length);
            expect(Object.keys(UNSUPPORTED_OPERATORS).length).toBe(unsupportedOperator.length);

            supportOperator.forEach(key => {
                expect(SUPPORT_OPERATORS[key]).toBe(key);
            });

            unsupportedOperator.forEach(key => {
                expect(UNSUPPORTED_OPERATORS[key]).toBe(key);
            });
        });

        it.each(supportOperator.map(item => [item]))(
            'test support operator parse token %s',
            a => {

                const tokenizer = new Tokenizer('z ' + a + ' x');
                let token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.NAME);
                expect(token.value).toBe('z');
                expect(token.raw).toBe('z');

                token = tokenizer.nextToken();
                expect(token.type).toBe(TokenType.OPERATOR);
                expect(token.value).toBe(a);
                expect(token.raw).toBe(a);

                token = tokenizer.nextToken();
                expect(token.type).toBe(TokenType.NAME);
                expect(token.value).toBe('x');
                expect(token.raw).toBe('x');

                token = tokenizer.nextToken();
                expect(token.type).toBe(TokenType.EOF);
            }
        );

        it.each(unsupportedOperator.map(item => [item]))(
            'test Unsupported operator parse token %s',
            a => {

                const tokenizer = new Tokenizer(a + ' x');

                expect(() => {
                    tokenizer.nextToken();
                }).toThrow();
            }
        );

        it('test op eof', () => {

            const tokenizer = new Tokenizer('+');
            let token = tokenizer.nextToken();

            expect(token.type).toBe(TokenType.OPERATOR);
            expect(token.value).toBe('+');
            expect(token.raw).toBe('+');

            token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.EOF);
        });
    });

    describe('Tokenizer arrow test', () => {

        it('test arrow', () => {

            const tokenizer = new Tokenizer('=>');
            let token = tokenizer.nextToken();

            expect(token.type).toBe(TokenType.ARROW);
            expect(token.value).toBe('=>');
            expect(token.raw).toBe('=>');

            token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.EOF);
        });
    });

    describe('Tokenizer word test', () => {

        it.each([
            'false', 'true', 'null'
        ])(
            'test operator parse token %s',
            a => {
                const tokenizer = new Tokenizer(a);
                let token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.ATOM);
                expect(token.value).toBe(a);
                expect(token.raw).toBe(a);

                token = tokenizer.nextToken();
                expect(token.type).toBe(TokenType.EOF);
            }
        );

        it('keyword after . should by name', () => {
            const tokenizer = new Tokenizer('a.new');

            let token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.NAME);
            expect(token.value).toBe('a');
            expect(token.raw).toBe('a');

            token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.PUNC);
            expect(token.value).toBe('.');
            expect(token.raw).toBe('.');

            token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.NAME);
            expect(token.value).toBe('new');
            expect(token.raw).toBe('new');

            token = tokenizer.nextToken();
            expect(token.type).toBe(TokenType.EOF);
        });
    });

    describe('Tokenizer keyword test', () => {

        const keywords = 'break case catch const continue debugger default '
            + 'delete do else finally for function if instanceof new return switch '
            + 'throw try var while with class enum export extends import super this';

        it.each(
            keywords.split(' ').map(item => [item])
        )(
            'test operator parse token %s',
            a => {
                const tokenizer = new Tokenizer(a);

                expect(() => {
                    tokenizer.nextToken();
                }).toThrow();
            }
        );
    });

    describe('Tokenizer punc test', () => {

        it.each('[]{}(),:'.split('').map(item => [item]))(
            'test operator parse token %s',
            a => {
                const tokenizer = new Tokenizer(a);
                let token = tokenizer.nextToken();

                expect(token.type).toBe(TokenType.PUNC);
                expect(token.value).toBe(a);
                expect(token.raw).toBe(a);

                token = tokenizer.nextToken();
                expect(token.type).toBe(TokenType.EOF);
            }
        );

        it('test operator ; throw', () => {

            const tokenizer = new Tokenizer(';');

            expect(() => {
                tokenizer.nextToken();
            }).toThrow(/Unexpected character/);
        });
    });

    describe('test invalid char', () => {
        it.each([
            ['\0x02'],
            ['\0x03']
        ])(
            'test parse token',
            a => {

                const tokenizer = new Tokenizer(a);

                expect(() => {
                    tokenizer.nextToken();
                }).toThrow(/Unexpected character/);
            }
        );

    });
});
