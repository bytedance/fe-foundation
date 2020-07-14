/**
 * @file Transform 转换并提取依赖
 */
import {AstNodeType, IAstNode, ICallAstNode} from './Parser';
import {TokenType} from './Tokenizer';

interface IPath {
    readonly node: IAstNode;
    readonly part: string;
    readonly scopeSymbols: {[key: string]: boolean};
    readonly isArray: boolean;
    readonly partIndex: number;
}

interface ITransformContext {
    readonly paths: IPath[];
}

export interface ITransformResult {
    readonly ast: IAstNode;
    readonly watchers: string[];
}

export interface IInterpolationSymbol {
    readonly direct: boolean; // 是否翻译成直接使用，而不是翻译成取值表达式，直接使用有更好的性能，但无法监控取值的信息。
    readonly symbol: string; // 在代码中出现的变量名字
    readonly level: boolean; // 是否包含级别信息，如果设置为true，则会默认识别级别信息，注意默认级别是1
}

export interface IInterpolationOptions {
    readonly symbols: IInterpolationSymbol[];
    readonly call: string; // 默认函数调用的fallback，注意如果call的字符串没有出现在symbols中会报错
    readonly default: string; // 默认变量调用注意如果call的字符串没有出现在symbols中会报错
    readonly dollar?: string; // 空闲的$符号的转义，当传递此参数时，下边allowUnknownDollar将强制为false
    readonly allowUnknownDollar?: boolean; // 是否允许不在定义中的$符号，默认是false
    readonly onBeforeProcess?: InterpolationTransformer; // 会在默认函数之前执行。如果返回true，则直接结束Process
    readonly onAfterProcess?: InterpolationTransformer; // 会在默认函数之后执行。如果返回true，则直接结束Process
}

export type InterpolationTransformer = (transform: Transform, ast: IAstNode) => ITransformResult | void;

const innerVars: string[] = [
    'undefined',
    'NaN',
    'Infinity'
];

const innerFunctions: string[] = [
    'isFinite',
    'isNaN',
    'parseFloat',
    'parseInt',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent'
];

const innerConstructors: string[] = [
    'Object',
    'Boolean',
    'Symbol',
    'Error',
    'Promise',
    'Array',
    'String',
    'RegExp',
    'Number'
];

const innerObjects: string[] = [
    'JSON',
    'Math'
];
const innerIdentifier = new RegExp(
    '^(' + [
        ...innerVars,
        ...innerConstructors,
        ...innerFunctions,
        ...innerConstructors,
        ...innerObjects
    ].join('|') + ')$'
);

export class Transform {

    private readonly validTopSymbol: RegExp;

    private readonly directMap: {[key: string]: boolean} = {};

    private readonly ast: IAstNode;

    private readonly allowUnknownDollar: boolean;

    private readonly options: IInterpolationOptions;

    constructor(ast: IAstNode, options: IInterpolationOptions) {

        this.ast = ast;
        this.options = options;
        this.allowUnknownDollar = options.dollar != null ? options.allowUnknownDollar || false : false;

        const matchesStr = options.symbols.map(({direct, level, symbol}) => {

            if (direct) {
                this.directMap[symbol] = true;
            }

            if (!level) {
                return symbol + '(?!\\d+)';
            }

            return symbol;
        });

        this.validTopSymbol = new RegExp('^\\$(' + matchesStr.join('|') + ')(\\d*)$');
    }

    public process(): ITransformResult {

        let filterProcessed = this.ast;

        if (this.options.onBeforeProcess) {

            const result = this.options.onBeforeProcess(this, filterProcessed);

            if (result) {
                return result;
            }
        }

        // 首先处理全部的Filter
        if (filterProcessed.type === AstNodeType.FILTER) {

            const filters = filterProcessed.filters;
            let expression = filterProcessed.expression;

            for (const item of filters) {
                item.args.unshift(expression);
                expression = item;
            }

            filterProcessed = expression;
        }

        // 如果顶级变量就是一个普通字符串
        if (filterProcessed.type === AstNodeType.SYMBOL && !this.validTopSymbol.test(filterProcessed.raw)) {

            if (/^\$/.test(filterProcessed.raw)) {
                if (this.options.dollar != null) {
                    filterProcessed = {
                        type: AstNodeType.PROPERTY,
                        property: filterProcessed.raw.slice(1),
                        expression: {
                            type: AstNodeType.SYMBOL,
                            value: '$' + this.options.dollar,
                            raw: '$' + this.options.dollar
                        }
                    };
                } else if (!this.allowUnknownDollar) {
                    throw new Error('$ is not allow in symbol');
                }
            } else {
                filterProcessed = {
                    type: AstNodeType.PROPERTY,
                    property: filterProcessed.raw,
                    expression: {
                        type: AstNodeType.SYMBOL,
                        value: '$' + this.options.default,
                        raw: '$' + this.options.default
                    }
                };
            }
        }

        // 处理顶级的变量
        this.transform(filterProcessed, (ast, context) => {

            const {paths} = context;
            const parent = paths[paths.length - 1];

            if (ast.type !== AstNodeType.SYMBOL) {
                return;
            }

            // 已经以$开头的不处理
            if (this.validTopSymbol.test(ast.raw)) {
                return;
            }

            if (innerIdentifier.test(ast.raw)) {
                return;
            }

            // 处理Scope
            if (paths.some(item => item.scopeSymbols[ast.raw])) {
                return;
            }

            if (ast.raw === '$_get_by_any') {
                return;
            }

            const astHasDollar = /^\$/.test(ast.raw);

            if (astHasDollar) {

                if (this.options.allowUnknownDollar) {
                    return;
                }

                if (this.options.dollar == null) {
                    throw new Error('$ is not allow in symbol');
                }
            }

            // 过滤掉对象属性
            if (parent.node.type === AstNodeType.OBJECT_PROPERTY && parent.part === 'key') {
                return;
            }

            // 处理顶级函数
            if (parent.node.type === AstNodeType.CALL && parent.part === 'expression') {

                parent.node.expression = {
                    type: AstNodeType.PROPERTY,
                    expression: {
                        type: AstNodeType.SYMBOL,
                        value: '$' + this.options.call,
                        raw: '$' + this.options.call
                    },
                    property: ast.raw
                };

                return;
            }


            // 处理顶级变量
            const pn = {
                type: AstNodeType.PROPERTY,
                expression: {
                    type: AstNodeType.SYMBOL,
                    value: '$' + (astHasDollar ? this.options.dollar : this.options.default),
                    raw: '$' + (astHasDollar ? this.options.dollar : this.options.default)
                },
                property: astHasDollar ? ast.raw.slice(1) : ast.raw
            };

            if (parent.isArray) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const pp = (parent.node as any)[parent.part];
                pp.splice(parent.partIndex, 1, pn);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (parent.node as any)[parent.part] = pn;
            }
        });

        // 将所有的变量获取变成函数调用
        this.transform(filterProcessed, (ast, context) => {

            if (ast.type !== AstNodeType.SYMBOL || ast.raw.slice(0, 1) !== '$') {
                return;
            }

            const {paths} = context;

            // 已经以$开头或者在黑名单里面的不处理
            if (!this.allowUnknownDollar && !this.validTopSymbol.test(ast.raw) || this.directMap[RegExp.$1]) {
                return;
            }

            let index = paths.length - 1;
            const pss: IAstNode[] = [];

            // eslint-disable-next-line no-constant-condition
            while (true) {

                const parent = paths[index--];
                const pp = paths[index];

                if (!parent
                    || parent.node.type !== AstNodeType.PROPERTY
                    || parent.part !== 'expression'
                    // 函数调用的情况下，不重新获取，以免丢失this
                    || pp && pp.node.type === AstNodeType.CALL && pp.part === 'expression'
                ) {

                    pss.unshift({
                        type: AstNodeType.LITERAL,
                        literal: TokenType.STRING,
                        value: ast.raw.slice(1),
                        raw: '"' + ast.raw.slice(1) + '"'
                    });

                    // 处理顶级变量
                    const pn: ICallAstNode = {
                        type: AstNodeType.CALL,
                        expression: {
                            type: AstNodeType.SYMBOL,
                            value: '$_get_by_any',
                            raw: '$_get_by_any'
                        },
                        args: pss
                    };

                    if (!parent) {
                        filterProcessed = pn;
                    } else if (parent.isArray) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const pp = (parent.node as any)[parent.part];
                        pp.splice(parent.partIndex, 1, pn);
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (parent.node as any)[parent.part] = pn;
                    }

                    return;
                }

                if (typeof parent.node.property === 'string') {
                    pss.push({
                        type: AstNodeType.LITERAL,
                        literal: TokenType.STRING,
                        value: parent.node.property,
                        raw: '"' + parent.node.property + '"'
                    });
                } else {
                    pss.push(parent.node.property);
                }
            }
        });

        if (this.options.onAfterProcess) {

            const result = this.options.onAfterProcess(this, filterProcessed);

            if (result) {
                return result;
            }
        }

        // 从代码里面提取全部的Watcher
        const watchers: {[key: string]: boolean} = {};

        this.transform(filterProcessed, ast => {

            if (ast.type !== AstNodeType.CALL) {
                return;
            }

            const {expression, args} = ast;

            if (expression.type !== AstNodeType.SYMBOL || expression.raw !== '$_get_by_any') {
                return;
            }

            const found = [];

            for (const item of args) {

                // 找到第一个不为常量的
                if (item.type !== AstNodeType.LITERAL) {
                    break;
                }

                if (item.literal !== TokenType.STRING && item.literal !== TokenType.NUM) {
                    break;
                }

                found.push(String(item.value));
            }

            watchers[found.join('.')] = true;
        });

        return {
            ast: filterProcessed,
            watchers: Object.keys(watchers)
        };
    }

    // 从里面往外递归
    private transform(
        ast: IAstNode,
        callback: (node: IAstNode, context: ITransformContext) => void,
        context?: ITransformContext
    ): void {

        if (!context) {
            context = {
                paths: []
            };
        }

        const scopeSymbols: {[key: string]: boolean} = {};

        const {
            paths
        } = context;

        if (ast.type === AstNodeType.ARROW) {
            ast.params.forEach(item => scopeSymbols[item.raw] = true);
        }

        Object.keys(ast).forEach(key => {

            if (key === 'type') {
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = (ast as any)[key];

            if (Array.isArray(value)) {

                value.forEach((item, i) => {
                    this.transform(item, callback, {
                        paths: paths.concat({
                            node: ast,
                            part: key,
                            scopeSymbols,
                            isArray: true,
                            partIndex: i
                        })
                    });
                });
            } else if (typeof value === 'object') {
                this.transform(value, callback, {
                    paths: paths.concat({
                        node: ast,
                        part: key,
                        scopeSymbols,
                        isArray: false,
                        partIndex: 0
                    })
                });
            }
        });

        callback(ast, context);
    }
}
