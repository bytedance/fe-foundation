/**
 * @file index 插值处理
 */

import {deepClone} from '@co-hooks/util';
import {DomNode} from '@co-hooks/dom-node';
import {AstNodeType, IAstNode, Parser} from '../lib/Parser';
import {IInterpolationOptions, Transform} from '../lib/Transform';
import {Generator} from '../lib/Generator';
import {IObjectPropertyAstNode, TokenType} from '..';

export type IGetByAny = (type: string, ...args: string[]) => unknown;

export type IInterpolationFunc = (getter: IGetByAny, ...args: unknown[]) => unknown;

export interface IInterpolationInfo {

    // 转换出来的ast
    ast: IAstNode;

    // 原插值信息
    expr: string;

    // 生成的代码
    code: string;

    // 监控字段
    watchers: string[];

    func: IInterpolationFunc;
}

/**
 * 插值表达式处理
 *
 * @param expr 是解析的表达式
 * @param options 解析配置项
 */
export function transformExpression(expr: string, options: IInterpolationOptions): IInterpolationInfo {

    const parser = new Parser(expr);
    const ast = parser.process();
    const transform = new Transform(ast, options);
    const {ast: transformedAst, watchers} = transform.process();
    const generator = new Generator(transformedAst);
    const code = generator.process();
    const direct = options.symbols.filter(item => item.direct).map(item => '$' + item.symbol);
    const func = new Function('$_get_by_any', ...direct, 'return (' + code + ')') as IInterpolationFunc;

    return {
        ast: transformedAst,
        expr,
        code,
        watchers,
        func
    };

}

const validDivisionCharRE = /[\w).+\-_$\]'"}]/;

/**
 * 从字符串中提取成表达式
 *
 * @param str 要提取的字符串
 */
export function extractTemplateString(str: string): string {

    // 空字符串不处理
    if (str === '') {
        return '""';
    }

    const expressions: Array<{isString: boolean; expression: string}> = [];
    let inSingle = false;
    let inDouble = false;
    let inRegex = false;
    let inExpression = false;
    let curly = 0;
    let start = 0;
    let c = 0;
    let prev: number;

    for (let i = 0; i < str.length; i++) {

        prev = c;
        c = str.charCodeAt(i);

        // 不在表达式中的话，直接加上去就行了
        if (!inExpression) {

            // 开始一个表达式
            if (c === 0x7B && prev === 0x24) {

                const expression = str.slice(start, i - 1);

                if (expression) {
                    expressions.push({
                        isString: true,
                        expression: JSON.stringify(expression)
                    });
                }

                start = i + 1;
                inExpression = true;
            }

            continue;
        }

        if (inSingle) {
            inSingle = c !== 0x27 || prev === 0x5C;
        } else if (inDouble) {
            inDouble = c !== 0x22 || prev === 0x5C;
        } else if (inRegex) {
            inRegex = c !== 0x2f || prev === 0x5C;
        } else if (c === 0x7D && !curly) {

            // 当前表达式结束了
            expressions.push({
                isString: false,
                expression: str.slice(start, i)
            });
            inExpression = false;
            start = i + 1;
        } else {

            switch (c) {
                case 0x22:
                    inDouble = true;
                    break;
                case 0x27:
                    inSingle = true;
                    break;
                case 0x7B:
                    curly++;
                    break;
                case 0x7D:
                    curly--;
                    break;
            }

            if (c === 0x2f) {

                let p;

                for (let j = i - 1; j >= start; j--) {

                    p = str.charAt(j);

                    if (p !== ' ') {
                        break;
                    }
                }

                if (!p || !validDivisionCharRE.test(p)) {
                    inRegex = true;
                }
            }
        }
    }

    if (inExpression) {
        throw new Error('invalid template string end, str = `' + str + '`');
    }

    const last = str.slice(start);

    if (last) {
        expressions.push({
            isString: true,
            expression: JSON.stringify(last)
        });
    }

    if (expressions.length > 1) {

        const strList = expressions.map(item => (item.isString ? item.expression : '(' + item.expression + ')'));

        return strList.join(' + ');
    }

    return expressions[0].expression;
}

/**
 * 字符串模板处理
 *
 * @param str 模板字符串
 * @param options 解析配置项
 */
export function transformTemplateString(str: string, options: IInterpolationOptions): IInterpolationInfo {

    const expression = extractTemplateString(str);

    const result = transformExpression(expression, options);

    result.expr = str;

    return result;
}

export interface IBindingConfig {
    key: string;
    expr: string;
}

export interface IBindingNodeInfo {
    field: string;
    expr?: string;
}

export interface IJsonInterpolationOptions<T> extends IInterpolationOptions {
    objectBinding?: {
        key: string;
        process: (config: T, staticValue: unknown) => IInterpolationInfo | null;
    };
}

class JsonBuilder<T> {

    private readonly data: unknown;

    private readonly options: IJsonInterpolationOptions<T>;

    // 根绑定节点
    private readonly root: DomNode<IBindingNodeInfo | null>;

    // 所有提取出来的监控节点
    private readonly watchers: {[key: string]: boolean} = {};

    // 处理完成的ast
    private readonly ast: IAstNode;

    constructor(data: unknown, options: IJsonInterpolationOptions<T>, bindings: IBindingConfig[]) {

        this.root = new DomNode<IBindingNodeInfo | null>(null);
        this.data = data;
        this.options = options;

        // 初始化所有的Binding
        this.initBinding(bindings);

        // 编译节点
        this.ast = this.process(data, []);

    }

    public getResult(): IInterpolationInfo {

        const {options, ast} = this;
        const generator = new Generator(this.ast);
        const code = generator.process();
        const watchers = Object.keys(this.watchers);
        const direct = options.symbols.filter(item => item.direct).map(item => '$' + item.symbol);
        const func = new Function('$_get_by_any', ...direct, 'return (' + code + ')') as IInterpolationFunc;

        return {
            expr: JSON.stringify(this.data),
            func,
            code,
            watchers,
            ast
        };
    }

    // 初始化全部的Binding，形成一个树
    private initBinding(bindings: IBindingConfig[]): void {

        bindings.forEach(item => {

            const {key, expr} = item;

            if (!key) {
                throw new Error('key is empty');
            }

            const keys = key.split('.');

            let node = this.root;

            for (let field of keys) {

                let exist = node.getSubNode(item => {
                    const val = item.getValue();
                    return val != null && val.field === field;
                });

                if (!exist) {
                    exist = new DomNode<IBindingNodeInfo | null>({field}, node);
                    node.appendChild(exist);
                }

                node = exist;
            }

            const value = node.getValue();

            if (value == null) {
                return;
            }

            if (value.expr != null) {
                throw new Error('duplicated bind of ' + key);
            }

            node.setValue({
                ...value,
                expr
            });
        });
    }

    private process(obj: unknown, path: string[]): IAstNode {

        // 顶级的路径不能被绑定，所以至少要有1层的变量才需要考虑
        if (path.length > 0) {

            const bind = this.processBind(path);

            // 如果有表达式返回，不再处理孩子（所以绑定了顶级变量，子一级就不会生效了）
            if (bind) {
                return bind;
            }
        }

        // 处理undefined
        if (typeof obj === 'undefined') {

            return {
                type: AstNodeType.SYMBOL,
                value: 'undefined',
                raw: 'undefined'
            };
        }

        // 如果是bool或者数字，不需要处理
        if (typeof obj === 'boolean' || obj === null) {

            return {
                type: AstNodeType.LITERAL,
                literal: TokenType.ATOM,
                value: String(obj),
                raw: JSON.stringify(obj)
            };
        }

        if (typeof obj === 'number') {

            return {
                type: AstNodeType.LITERAL,
                literal: TokenType.NUM,
                value: obj,
                raw: JSON.stringify(obj)
            };
        }

        // 如果是字符串，需要看看，有没有插值
        if (typeof obj === 'string') {
            return this.processString(obj);
        }

        if (Array.isArray(obj)) {
            return this.processArray(obj, path);
        }

        if (typeof obj === 'object') {
            return this.processObject(obj as {[key: string]: unknown}, path);
        }

        throw new Error('invalid json type');
    }

    // 处理对象
    private processObject(obj: {[key: string]: unknown}, path: string[]): IAstNode {

        const binding = this.options.objectBinding;
        let objectBinding: Record<string, T> = {};

        if (binding && obj[binding.key]) {
            objectBinding = obj[binding.key] as Record<string, T>;
        }

        const bindingKeys = Object.keys(objectBinding)
            .filter(key => objectBinding[key] != null);
        const properties: IObjectPropertyAstNode[] = [];

        Object.keys(obj).forEach(key => {

            if (binding && binding.key === key || bindingKeys.indexOf(key) >= 0) {
                return;
            }

            const bindPath = path.concat(key);
            const value = obj[key];

            const result: IObjectPropertyAstNode = {
                type: AstNodeType.OBJECT_PROPERTY,
                key: {
                    type: AstNodeType.LITERAL,
                    literal: TokenType.STRING,
                    value: key,
                    raw: JSON.stringify(key)
                },
                value: this.process(value, bindPath)
            };

            properties.push(result);
        });

        bindingKeys.forEach(key => {

            if (!binding) {
                return;
            }

            const value = obj[key];
            const bindConfig = objectBinding[key];
            const res = binding.process(bindConfig, value);

            // 如果不需要替换，返回null
            if (res == null) {

                const bindPath = path.concat(key);
                const value = obj[key];

                const result: IObjectPropertyAstNode = {
                    type: AstNodeType.OBJECT_PROPERTY,
                    key: {
                        type: AstNodeType.LITERAL,
                        literal: TokenType.STRING,
                        value: key,
                        raw: JSON.stringify(key)
                    },
                    value: this.process(value, bindPath)
                };

                properties.push(result);
                return
            }

            const {watchers, ast} = res;

            watchers.forEach(item => this.watchers[item] = true);

            const result: IObjectPropertyAstNode = {
                type: AstNodeType.OBJECT_PROPERTY,
                key: {
                    type: AstNodeType.LITERAL,
                    literal: TokenType.STRING,
                    value: key,
                    raw: JSON.stringify(key)
                },
                value: ast
            };

            properties.push(result);
        });

        return {
            type: AstNodeType.OBJECT,
            properties
        };
    }

    // 处理字符串
    private processString(obj: string): IAstNode {

        const {ast, watchers} = transformTemplateString(obj, this.options);

        watchers.forEach(item => this.watchers[item] = true);

        return ast;
    }

    // 处理绑定（如果父亲绑定了，那孩子的绑定无效）
    private processBind(path: string[]): IAstNode | null {

        let nodes: Array<DomNode<IBindingNodeInfo | null>> = [this.root];

        path.forEach(key => {

            const old = nodes;

            nodes = [];

            old.forEach(node => {

                const exist = node.getSubNode(item => {
                    const val = item.getValue();
                    return val != null && val.field === key;
                });
                const existAny = node.getSubNode(item => {
                    const val = item.getValue();
                    return val != null && val.field === '*';
                });

                if (exist) {
                    nodes.push(exist);
                }

                if (existAny) {
                    nodes.push(existAny);
                }
            });
        });

        nodes = nodes.filter(item => item.getValue());

        if (nodes.length > 1) {
            throw new Error('multiple bind for one prop: ' + path.join('.'));
        }

        if (nodes.length) {

            const value = nodes[0].getValue();

            if (value == null || value.expr == null) {
                return null;
            }

            const {watchers, ast} = transformExpression(value.expr, this.options);

            watchers.forEach(key => this.watchers[key] = true);

            return deepClone(ast);
        }

        return null;
    }

    // 处理数组
    private processArray(obj: unknown[], path: string[]): IAstNode {

        const elements: IAstNode[] = obj.map((item, i) => this.process(item, path.concat(String(i))));

        return {
            type: AstNodeType.ARRAY,
            elements
        };
    }
}

/**
 * 字符串模板处理
 *
 * @param data JSON数据
 * @param options 解析配置项
 * @param bindings 绑定列表
 */
export function transformJson<T>(
    data: unknown,
    options: IJsonInterpolationOptions<T>,
    bindings: IBindingConfig[] = []
): IInterpolationInfo {

    const builder = new JsonBuilder(data, options, bindings);

    return builder.getResult();
}
