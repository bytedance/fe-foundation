/**
 * @file Parser
 */
import {keyMirror} from '@co-hooks/util';
import {IToken, PRECEDENCE, TokenType, Tokenizer, UNARY_PREFIX} from './Tokenizer';

export enum AstNodeType {
    CONDITIONAL = 'conditional',
    UNARY = 'unary',
    BINARY = 'binary',
    PROPERTY = 'property',
    LITERAL = 'literal',
    SYMBOL = 'symbol',
    CALL = 'call',
    ARRAY = 'array',
    OBJECT = 'object',
    OBJECT_PROPERTY = 'object_property',
    PARENTHESES = 'parentheses',
    FILTER = 'filter',
    ARROW = 'arrow'
}

// 过滤器
export interface IFilterAstNode {
    readonly type: AstNodeType.FILTER;
    expression: IAstNode;
    filters: ICallAstNode[];
}

// 三元运算符
export interface IConditionalAstNode {
    readonly type: AstNodeType.CONDITIONAL;
    condition: IAstNode;
    yes: IAstNode;
    alternative: IAstNode;
}

// 一元运算符
export interface IUnaryAstNode {
    readonly type: AstNodeType.UNARY;
    op: string;
    expression: IAstNode;
}

// 二元运算符
export interface IBinaryAstNode {
    readonly type: AstNodeType.BINARY;
    op: string;
    left: IAstNode;
    right: IAstNode;
}

// 二元运算符
export interface IArrowAstNode {
    readonly type: AstNodeType.ARROW;
    params: IAtomSymbolAstNode[];
    body: IAstNode;
}

// 属性节点
export interface IPropertyAstNode {
    readonly type: AstNodeType.PROPERTY;
    expression: IAstNode;
    property: string | IAstNode;
}

// 常量节点
export interface ILiteralAstNode {
    readonly type: AstNodeType.LITERAL;
    literal: TokenType;
    value: RegExp | string | number;
    raw: string;
}

// 外部变量节点
export interface IAtomSymbolAstNode {
    readonly type: AstNodeType.SYMBOL;
    value: string;
    raw: string;
}

// 函数调用
export interface ICallAstNode {
    readonly type: AstNodeType.CALL;
    expression: IAstNode;
    args: IAstNode[];
}

export type IAtomNodeAstNode = IArrowAstNode | IAtomSymbolAstNode | ILiteralAstNode;

export interface IParenthesesAstNode {
    readonly type: AstNodeType.PARENTHESES;
    expression: IAstNode;
}

export interface IArrayAstNode {
    readonly type: AstNodeType.ARRAY;
    elements: IAstNode[];
}

export interface IObjectPropertyAstNode {
    readonly type: AstNodeType.OBJECT_PROPERTY;
    key: IAtomNodeAstNode;
    value: IAstNode;
}

export interface IObjectAstNode {
    readonly type: AstNodeType.OBJECT;
    properties: IObjectPropertyAstNode[];
}

// 所有节点
export type IAstNode = IFilterAstNode | IConditionalAstNode | IUnaryAstNode
| IBinaryAstNode | IPropertyAstNode | IAtomNodeAstNode
| ICallAstNode | IObjectAstNode | IObjectPropertyAstNode
| IArrayAstNode | IParenthesesAstNode;

const ATOMIC_START_TOKEN = keyMirror(['atom', 'num', 'string', 'regexp', 'name']);

export class Parser {

    private static isToken(token: IToken, type: TokenType, val?: string | number | RegExp): boolean {
        return token.type === type && (val == null || token.value === val);
    }

    // 解析器
    private readonly tokenizer: Tokenizer;

    // 当前使用的token
    private token: IToken;

    constructor(expr: string) {
        this.tokenizer = new Tokenizer(expr);
        this.token = this.tokenizer.nextToken();
    }

    public process(): IAstNode {
        return this.processFilter();
    }

    public processFilterItem(): ICallAstNode {

        const token = this.token;
        const expr: IAtomSymbolAstNode = {
            type: AstNodeType.SYMBOL,
            value: token.value as string,
            raw: token.raw
        };

        this.next();

        if (this.is(TokenType.PUNC, '(')) {

            this.next();

            return {
                type: AstNodeType.CALL,
                expression: expr,
                args: this.processExprList(')')
            };
        }

        return {
            type: AstNodeType.CALL,
            expression: expr,
            args: []
        };
    }

    private next(): IToken {
        return this.token = this.tokenizer.nextToken();
    }

    private is(type: TokenType, val?: string | number | RegExp): boolean {
        return Parser.isToken(this.token, type, val);
    }

    private expectToken(type: TokenType, val?: string | number | RegExp): void {

        if (this.is(type, val)) {
            this.next();
            return;
        }

        throw new Error(`Unexpected token ${type} ${val}`);
    }

    private expectPunc(punc: string): void {
        return this.expectToken(TokenType.PUNC, punc);
    }

    // 处理过滤器
    private processFilter(): IAstNode {

        const expr = this.processConditional();
        const filters: ICallAstNode[] = [];

        while (this.is(TokenType.OPERATOR, '|')) {
            this.next();
            filters.push(this.processFilterItem());
        }

        if (!this.is(TokenType.EOF)) {
            throw new Error('Unexpect Token after filter');
        }

        if (filters.length) {
            return {
                type: AstNodeType.FILTER,
                expression: expr,
                filters
            };
        }

        return expr;
    }

    // 处理三元运算符
    private processConditional(): IAstNode {

        const expr = this.processBinary(this.processUnary(), 0);

        if (this.is(TokenType.OPERATOR, '?')) {

            this.next();

            const yes = this.processConditional();

            this.expectPunc(':');

            const alternative = this.processConditional();

            return {
                type: AstNodeType.CONDITIONAL,
                condition: expr,
                yes,
                alternative
            };
        }

        return expr;
    }

    // 处理一元运算符
    private processUnary(): IAstNode {

        const op = this.is(TokenType.OPERATOR) ? this.token.value : null;

        if (op && UNARY_PREFIX[op as string]) {

            this.next();

            return {
                type: AstNodeType.UNARY,
                op: op as string,
                expression: this.processUnary()
            };
        }

        return this.processAtom();
    }

    // 处理二元运算符
    private processBinary(left: IAstNode, minPrecedence: number): IAstNode {

        const op = this.is(TokenType.OPERATOR) ? this.token.value as string : null;

        if (op == null) {
            return left;
        }

        const precedence = PRECEDENCE[op];

        if (precedence != null && precedence > minPrecedence) {

            this.next();

            const right = this.processBinary(this.processUnary(), precedence);

            return this.processBinary({
                type: AstNodeType.BINARY,
                left,
                op,
                right
            }, minPrecedence);
        }

        return left;
    }

    // 处理原子运算符
    private processAtom(): IAstNode {

        const token = this.token;

        if (Parser.isToken(token, TokenType.PUNC)) {

            if (token.value === '(') {
                this.next();

                const list = this.processExprList(')');

                // 箭头函数
                if (this.is(TokenType.ARROW)) {

                    if (!list.every(item => item.type === AstNodeType.SYMBOL)) {
                        throw new Error('Invalid arrow params');
                    }

                    this.next();
                    const body = this.processConditional();

                    return {
                        type: AstNodeType.ARROW,
                        params: list as IAtomSymbolAstNode[],
                        body
                    };
                }

                if (list.length > 1) {
                    throw new Error('Comma expression is not support');
                }

                return this.processSubscripts({
                    type: AstNodeType.PARENTHESES,
                    expression: list[0]
                });
            } else if (token.value === '[') {
                return this.processSubscripts(this.processArray());
            } else if (token.value === '{') {
                return this.processSubscripts(this.processObject());
            }

            throw new Error(`Unexpected token: ${token.type} (${token.value})`);
        }

        if (ATOMIC_START_TOKEN[token.type]) {
            return this.processSubscripts(this.processAtomNode());
        }

        throw new Error(`Unexpected token: ${token.type} (${token.value})`);
    }

    private processArray(): IAstNode {

        this.expectPunc('[');

        return {
            type: AstNodeType.ARRAY,
            elements: this.processExprList(']')
        };
    }

    private processObject(): IAstNode {

        this.expectPunc('{');

        let first = true;
        const list: IObjectPropertyAstNode[] = [];

        while (!this.is(TokenType.PUNC, '}')) {

            if (first) {
                first = false;
            } else {
                this.expectPunc(',');
            }

            const key = this.processAtomNode();

            this.expectPunc(':');
            list.push({
                type: AstNodeType.OBJECT_PROPERTY,
                key,
                value: this.processConditional()
            });
        }

        this.next();

        return {
            type: AstNodeType.OBJECT,
            properties: list
        };
    }

    private processSubscripts(expr: IAstNode): IAstNode {

        if (this.is(TokenType.PUNC, '.')) {

            this.next();

            const token = this.token;

            if (token.type !== TokenType.NAME) {
                throw new Error(`Unexpected token: ${token.type} (${token.value})`);
            }

            const ret: IPropertyAstNode = {
                type: AstNodeType.PROPERTY,
                expression: expr,
                property: token.value as string
            };

            this.next();

            return this.processSubscripts(ret);
        }

        if (this.is(TokenType.PUNC, '[')) {

            this.next();

            const prop = this.processConditional();

            this.expectPunc(']');

            return this.processSubscripts({
                type: AstNodeType.PROPERTY,
                expression: expr,
                property: prop
            });
        }

        if (this.is(TokenType.PUNC, '(')) {

            this.next();

            return this.processSubscripts({
                type: AstNodeType.CALL,
                expression: expr,
                args: this.processExprList(')')
            });
        }

        return expr;
    }

    private processExprList(closing: string): IAstNode[] {

        let first = true;
        const list: IAstNode[] = [];

        while (!this.is(TokenType.PUNC, closing)) {

            if (first) {
                first = false;
            } else {
                this.expectPunc(',');
            }

            list.push(this.processConditional());
        }

        this.next();

        return list;
    }

    private processAtomNode(): IAtomNodeAstNode {

        const tok = this.token;

        if (tok.type === TokenType.NAME) {
            this.next();
            const symbol: IAtomSymbolAstNode = {
                type: AstNodeType.SYMBOL,
                value: tok.value as string,
                raw: tok.raw
            };
            if (this.is(TokenType.ARROW)) {

                this.next();
                const body = this.processConditional();

                return {
                    type: AstNodeType.ARROW,
                    params: [symbol],
                    body
                };
            }
            return symbol;
        }

        this.next();

        return {
            type: AstNodeType.LITERAL,
            literal: tok.type,
            value: tok.value,
            raw: tok.raw
        };
    }
}
