/**
 * @file Generator 代码生成器
 */

import {
    AstNodeType,
    IArrayAstNode,
    IArrowAstNode,
    IAstNode,
    IAtomSymbolAstNode,
    IBinaryAstNode,
    ICallAstNode,
    IConditionalAstNode,
    ILiteralAstNode,
    IObjectAstNode,
    IParenthesesAstNode,
    IPropertyAstNode,
    IUnaryAstNode
} from './Parser';

export class Generator {

    private result: string = '';

    private readonly ast: IAstNode;

    constructor(ast: IAstNode) {
        this.ast = ast;
    }

    public process(): string {
        this.print(this.ast);
        return this.getResult();
    }

    public getResult(): string {
        return this.result;
    }

    private print(ast: IAstNode): void {

        switch (ast.type) {
            case AstNodeType.CONDITIONAL:
                this.printConditional(ast);
                return;
            case AstNodeType.UNARY:
                this.printUnary(ast);
                return;
            case AstNodeType.BINARY:
                this.printBinary(ast);
                return;
            case AstNodeType.LITERAL:
                this.printLiteral(ast);
                return;
            case AstNodeType.SYMBOL:
                this.printLiteral(ast);
                return;
            case AstNodeType.PROPERTY:
                this.printProperty(ast);
                return;
            case AstNodeType.CALL:
                this.printCall(ast);
                return;
            case AstNodeType.ARRAY:
                this.printArray(ast);
                return;
            case AstNodeType.ARROW:
                this.printArrow(ast);
                return;
            case AstNodeType.OBJECT:
                this.printObject(ast);
                return;
            case AstNodeType.PARENTHESES:
                this.printParentheses(ast);
                return;
        }

        throw new Error('Unexpect Ast Type: ' + ast.type);
    }

    private printConditional(ast: IConditionalAstNode): void {
        this.print(ast.condition);
        this.space();
        this.write('?');
        this.space();
        this.print(ast.yes);
        this.space();
        this.write(':');
        this.space();
        this.print(ast.alternative);
    }

    private printUnary(ast: IUnaryAstNode): void {

        this.write(ast.op);

        if (ast.op === 'typeof' || ast.op === 'void') {
            this.space();
        }

        this.print(ast.expression);
    }

    private printBinary(ast: IBinaryAstNode): void {
        this.print(ast.left);
        this.space();
        this.write(ast.op);
        this.space();
        this.print(ast.right);
    }

    private printProperty(ast: IPropertyAstNode): void {

        const property = ast.property;

        this.print(ast.expression);

        if (typeof property === 'string') {
            this.write('.');
            this.write(property);
        } else {
            this.write('[');
            this.print(property);
            this.write(']');
        }
    }

    private printCall(ast: ICallAstNode): void {

        this.print(ast.expression);
        this.write('(');

        for (let i = 0; i < ast.args.length; i++) {

            this.print(ast.args[i]);

            if (i !== ast.args.length - 1) {
                this.write(',');
                this.space();
            }
        }

        this.write(')');
    }

    private printLiteral(ast: ILiteralAstNode | IAtomSymbolAstNode): void {
        this.write(ast.raw);
    }

    private printArrow(ast: IArrowAstNode): void {
        this.write('(');
        this.write('function');
        this.space();
        this.write('(');

        for (let i = 0; i < ast.params.length; i++) {

            this.print(ast.params[i]);

            if (i !== ast.params.length - 1) {
                this.write(',');
                this.space();
            }
        }

        this.write(')');
        this.space();
        this.write('{');
        this.write('return');
        this.space();
        this.print(ast.body);
        this.write('}');
        this.write(')');
    }

    private printArray(ast: IArrayAstNode): void {

        this.write('[');

        for (let i = 0; i < ast.elements.length; i++) {

            this.print(ast.elements[i]);

            if (i !== ast.elements.length - 1) {
                this.write(',');
                this.space();
            }
        }

        this.write(']');
    }

    private printObject(ast: IObjectAstNode): void {

        this.write('{');

        for (let i = 0; i < ast.properties.length; i++) {

            const {key, value} = ast.properties[i];

            this.print(key);
            this.write(':');
            this.space();
            this.print(value);

            if (i !== ast.properties.length - 1) {
                this.write(',');
                this.space();
            }
        }

        this.write('}');
    }

    private printParentheses(ast: IParenthesesAstNode): void {
        this.write('(');
        this.print(ast.expression);
        this.write(')');
    }

    private space(): void {
        this.result += ' ';
    }

    private write(word: string): void {
        this.result += word;
    }
}
