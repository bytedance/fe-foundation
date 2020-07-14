/**
 * @file tokenizer 词法解析
 */

import {keyMirror} from '@co-hooks/util';

export enum TokenType {
    EOF = 'eof',
    OPERATOR = 'operator',
    PUNC = 'punc',
    STRING = 'string',
    NUM = 'num',
    NAME = 'name',
    ATOM = 'atom',
    KEYWORD = 'keyword',
    REGEXP = 'regexp',
    ARROW = 'arrow'
}

// 一元前缀
export const UNARY_PREFIX = keyMirror([
    'typeof',
    'void',
    '!',
    '-',
    '+'
]);

// 二元运算
export const PRECEDENCE: {[key: string]: number} = {
    '||': 1,
    '&&': 2,
    '==': 3,
    '===': 3,
    '!=': 3,
    '!==': 3,
    '<': 4,
    '>': 4,
    '<=': 4,
    '>=': 4,
    'in': 4,
    '+': 5,
    '-': 5,
    '*': 6,
    '/': 6,
    '%': 6
};

// 支持的运算
export const SUPPORT_OPERATORS = keyMirror([...Object.keys(UNARY_PREFIX), ...Object.keys(PRECEDENCE), '?', '|']);

// 不支持的运算符号
export const UNSUPPORTED_OPERATORS = keyMirror([
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
]);

// 全部的运算符
export const OPERATORS = keyMirror([...Object.keys(SUPPORT_OPERATORS), ...Object.keys(UNSUPPORTED_OPERATORS)]);

// 关键字
export const KEYWORDS = keyMirror(('break case catch const continue debugger default delete do else finally '
    + 'for function if in instanceof new return switch throw try typeof var void while with class enum export'
    + ' extends import super this').split(' '));

// 用于判断空白字符
export const WHITESPACE_CHARS = keyMirror(' \u00a0\u000b\u200b\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007'
    + '\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\uFEFF');

// PUNC起始字符
export const PUNC_BEFORE_EXPRESSION = keyMirror('[{(,:');

// PUNC支持字符
export const PUNC_CHARS = keyMirror('[]{}(),:');

// 运算包含字符串
export const OPERATOR_CHARS = keyMirror('+-*&%=<>!?|~^');

// 几个原子常量
export const KEYWORDS_ATOM = keyMirror(['true', 'false', 'null']);

// 用于判断数字
function isDigit(code: number): boolean {
    return code >= 48 && code <= 57;
}

// 用于判断字母
function isLetter(code: number): boolean {
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
}

// 判断是不是一个合法的标识符开始
function isIdentifierStart(code: number): boolean {
    return code === 36 || code === 95 || isLetter(code);
}

// 判断是否是一个合法的标识符
function isIdentifierChar(ch: string): boolean {

    const code = ch.charCodeAt(0);

    return isIdentifierStart(code) || isDigit(code);
}

function isAlphanumericChar(code: number): boolean {
    return isDigit(code) || isLetter(code);
}

const RE_HEX_NUMBER = /^0x[0-9a-f]+$/i;
const RE_OCT_NUMBER = /^0[0-7]+$/;

function parseJsNumber(num: string): number {

    if (RE_HEX_NUMBER.test(num)) {
        return parseInt(num.substr(2), 16);
    }

    if (RE_OCT_NUMBER.test(num)) {
        return parseInt(num.substr(1), 8);
    }

    return +num;
}

export interface IToken {
    readonly type: TokenType;
    readonly value: string | number | RegExp;
    readonly raw: string;
}

export class Tokenizer {

    // 当前和表达式
    private readonly expr: string = '';

    // 当前的扫描位置
    private pos: number = 0;

    // 当前token开始的位置
    private tokenPos: number = 0;

    // 下一个token是否可以是正则
    private regexAllowed: boolean = true;

    // 前一个字符是不是点
    private prevWasDot: boolean = false;

    constructor(expr: string) {

        // 因为是表达式解析，所有直接换成一行
        this.expr = expr.replace(/[\r\n\t\f]/g, ' ');
    }

    public nextToken(): IToken {

        let ch;

        this.skipWhitespace();
        this.tokenPos = this.pos;

        ch = this.peek();

        if (!ch) {
            return this.token(TokenType.EOF, '');
        }

        const code = ch.charCodeAt(0);

        switch (code) {
            case 34:
            case 39:
                return this.readString();
            case 46:
                return this.handleDot();
            case 47: {
                return this.handleSlash();
            }
        }

        if (isDigit(code)) {
            return this.readNum();
        }

        if (ch === ';') {
            throw new Error('Unexpected character `;`');
        }

        if (PUNC_CHARS[ch]) {
            return this.token(TokenType.PUNC, this.next());
        }

        if (OPERATOR_CHARS[ch]) {
            return this.readOperator();
        }

        if (code === 92 || isIdentifierStart(code)) {
            return this.readWord();
        }

        throw new Error('Unexpected character \'' + ch + '\'');
    }

    private peek(): string {
        return this.expr.charAt(this.pos);
    }

    private next(forceNotEnd: boolean = false): string {

        // 拿一个字符出来
        const ch = this.expr.charAt(this.pos++);

        if (!ch && forceNotEnd) {
            throw new Error('Invalid end of expr');
        }

        return ch;
    }

    private token(type: TokenType, value: string | number | RegExp): IToken {

        if (type === TokenType.EOF) {
            return {
                type: TokenType.EOF,
                value: '',
                raw: ''
            };
        }

        this.regexAllowed = type === TokenType.OPERATOR
            || (type === TokenType.PUNC && !!PUNC_BEFORE_EXPRESSION[value as string]);

        this.prevWasDot = !!(type === 'punc' && value === '.');

        return {
            type,
            value,
            raw: this.expr.substring(this.tokenPos, this.pos)
        };
    }

    private skipWhitespace(): void {

        while (WHITESPACE_CHARS[this.peek()]) {
            this.next();
        }
    }

    private readWhile(pred: (ch: string, i: number) => boolean): string {

        let ret = '';
        let ch;
        let i = 0;

        while ((ch = this.peek()) && pred(ch, i++)) {
            ret += this.next();
        }

        return ret;
    }

    private readNum(prefix: string = ''): IToken {

        let hasE = false;
        let afterE = false;
        let hasX = false;
        let hasDot = prefix === '.';

        let num = this.readWhile((ch: string) => {

            const code = ch.charCodeAt(0);

            if (code === 120 || code === 88) {

                if (hasX) {
                    return false;
                }

                return hasX = true;
            }

            if (code === 101 || code === 69) {

                if (hasX) {
                    return true;
                }

                if (hasE) {
                    return false;
                }

                return hasE = afterE = true;
            }

            if (code === 45 || code === 43) {
                return afterE;
            }

            afterE = false;

            if (code === 46) {

                if (!hasDot && !hasX && !hasE) {
                    return hasDot = true;
                }

                return false;
            }

            return isAlphanumericChar(code);
        });

        if (prefix) {
            num = prefix + num;
        }

        const valid = parseJsNumber(num);

        if (!isNaN(valid)) {
            return this.token(TokenType.NUM, valid);
        }

        throw new Error('Invalid syntax: ' + num);
    }

    private readEscapedChar(): string {

        const ch = this.next(true);

        switch (ch.charCodeAt(0)) {

            case 110 :
                return '\n';
            case 114 :
                return '\r';
            case 116 :
                return '\t';
            case 98:
                return '\b';
            case 118 :
                return '\u000b'; // \v
            case 102 :
                return '\f';
            case 120 :
                return String.fromCharCode(this.hexBytes(2)); // \x
            case 117 :
                return String.fromCharCode(this.hexBytes(4)); // \u
        }

        if (ch >= '0' && ch <= '7') {
            return this.readOctalEscapeSequence(ch);
        }

        return ch;
    }

    private readOctalEscapeSequence(ch: string): string {

        // Read
        let p = this.peek();
        if (p >= '0' && p <= '7') {

            ch += this.next(true);

            if (ch[0] <= '3' && (p = this.peek()) >= '0' && p <= '7') {
                ch += this.next(true);
            }
        }

        // Parse
        if (ch === '0') {
            return '\0';
        }

        return String.fromCharCode(parseInt(ch, 8));
    }

    private hexBytes(n: number): number {

        let num = 0;

        for (; n > 0; --n) {

            const digit = parseInt(this.next(true), 16);

            if (isNaN(digit)) {
                throw new Error('Invalid hex-character pattern in string');
            }

            num = (num << 4) | digit;
        }

        return num;
    }

    private readString(): IToken {

        let ret = '';
        const quote = this.next();

        // eslint-disable-next-line no-constant-condition
        while (true) {

            let ch = this.next(true);

            if (ch === '\\') {
                ch = this.readEscapedChar();
            } else if (ch === quote) {
                break;
            }

            ret += ch;
        }

        return this.token(TokenType.STRING, ret);
    }

    private readName(): string {

        let name = '';
        let ch;

        while ((ch = this.peek()) != null) {

            if (isIdentifierChar(ch)) {
                name += this.next();
            } else {
                break;
            }
        }

        return name;
    }

    private readRegexp(): IToken {

        let source = '';
        let prevBackSlash = false;
        let ch;
        let inClass = false;

        while ((ch = this.next(true))) {

            if (prevBackSlash) {
                source += '\\' + ch;
                prevBackSlash = false;
            } else if (ch === '[') {
                inClass = true;
                source += ch;
            } else if (ch === ']' && inClass) {
                inClass = false;
                source += ch;
            } else if (ch === '/' && !inClass) {
                break;
            } else if (ch === '\\') {
                prevBackSlash = true;
            } else {
                source += ch;
            }
        }

        const mods = this.readName();
        const regexp = new RegExp(source, mods);

        return this.token(TokenType.REGEXP, regexp);
    }

    private readOperator(prefix: string = ''): IToken {

        const grow = (operator: string): string => {

            if (!this.peek()) {
                return operator;
            }

            const bigger = operator + this.peek();

            if (OPERATORS[bigger]) {
                this.next();
                return grow(bigger);
            } else if (bigger === '=>') {
                this.next();
                return bigger;
            }

            return operator;

        };

        const op = grow(prefix || this.next());

        if (op === '=>') {
            return this.token(TokenType.ARROW, op);
        }

        if (UNSUPPORTED_OPERATORS[op]) {
            throw new Error('Unsupported Operator: ' + op);
        }

        return this.token(TokenType.OPERATOR, op);
    }

    private handleSlash(): IToken {

        this.next();

        return this.regexAllowed ? this.readRegexp() : this.readOperator('/');
    }

    private handleDot(): IToken {
        this.next();
        return isDigit(this.peek().charCodeAt(0))
            ? this.readNum('.')
            : this.token(TokenType.PUNC, '.');
    }

    private readWord(): IToken {

        const word = this.readName();

        if (this.prevWasDot) {
            return this.token(TokenType.NAME, word);
        }

        if (KEYWORDS_ATOM[word]) {
            return this.token(TokenType.ATOM, word);
        }

        if (!KEYWORDS[word]) {
            return this.token(TokenType.NAME, word);
        }

        if (OPERATORS[word]) {

            if (UNSUPPORTED_OPERATORS[word]) {
                throw new Error('Unsupported Operator: ' + word);
            }

            return this.token(TokenType.OPERATOR, word);
        }

        throw new Error('keyword' + word + ' is not allow in expression');
    }
}
