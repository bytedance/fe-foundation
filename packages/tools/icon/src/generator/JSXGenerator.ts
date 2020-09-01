/**
 * @file ReactGenerator 输出React组件代码
 */

import {IGeneratorOptions} from '../Generator';
import {ISvgAttr, ISvgElementInfo, ISvgInfo, ISvgInlineStyleAttr, SvgShapeAttr} from '../types';
import {pascalCase} from '../util';
import {IconGenerator} from './IconGenerator';

export interface IReactGeneratorOptions extends IGeneratorOptions {

    // 是否使用默认导出
    useDefault?: boolean;

    // 是否导出类型
    useType?: boolean;

    // 是否使用JSX, helper
    useHelper?: boolean;

    // 是否需要给Wrapper传递Name
    wrapperNeedName?: boolean;

    // 是否需要编译RTL属性
    wrapperNeedRTL?: boolean;

    // 是否导出style
    style?: boolean;

    // 当前组件在rtl时是否需要翻转
    rtl?: boolean;

    // JSX helper名字
    helperName?: string;

    // 属性的名字，默认'props'
    propName?: string;

    // 样式属性名称，默认'props'
    stylePropName?: string;

    // 引用路径
    importPath?: string;

    // 额外的引用路径
    extraImport?: string[];
}

export class JSXGenerator extends IconGenerator {

    protected useDefault: boolean;
    protected useType: boolean;
    protected style: boolean;
    protected useHelper: boolean;
    protected helperName: string;
    protected propName: string;
    protected stylePropName: string;
    protected wrapperNeedName: boolean;
    protected importPath: string;
    protected extraImport: string[];
    protected rtl: boolean;
    protected wrapperNeedRTL: boolean;

    constructor(options: IReactGeneratorOptions) {

        super(options);

        this.useDefault = options.useDefault || false;
        this.useType = options.useType || false;
        this.style = options.style || false;
        this.useHelper = options.useHelper || false;
        this.helperName = options.helperName || 'h';
        this.propName = options.propName || 'props';
        this.stylePropName = options.stylePropName || 'props';
        this.wrapperNeedName = options.wrapperNeedName || false;
        this.extraImport = options.extraImport || [];
        this.importPath = options.importPath || '../runtime';
        this.rtl = options.rtl || false;
        this.wrapperNeedRTL = options.wrapperNeedRTL || false;
    }

    // eslint-disable-next-line max-statements
    public process(info: ISvgInfo): string {

        const {
            useDefault,
            useType,
            style,
            useHelper,
            helperName,
            propName,
            stylePropName,
            wrapperNeedName,
            wrapperNeedRTL,
            rtl,
            importPath,
            extraImport
        } = this;

        this.processHeaderComment();
        this.writeLine('/* tslint:disable: max-line-length */');
        this.writeLine('/* eslint-disable max-len */');

        if (extraImport.length) {
            extraImport.forEach(item => this.writeLine(item));
        }

        // 处理顶部引用import {IIconType, IconWrapper} from '../components/icon'
        this.write('import');
        this.space();
        this.write('{');

        const imports: string[] = [];
        const typeName = this.getInterfaceName('props', true);
        const wrapperName = this.getTypeName('wrapper');

        if (useType) {

            imports.push(typeName);

            if (useHelper) {
                imports.push(this.getTypeName('helper'));
            }
        }

        imports.push(wrapperName);
        this.write(imports.join(', '));
        this.write('}');
        this.space();
        this.write('from');
        this.space();
        this.write('\'');
        this.write(importPath);
        this.writeLine('\';');
        this.writeLine();

        // 处理顶部导出
        this.write('export');
        this.space();

        if (useDefault) {
            this.write('default');
            this.space();
        }

        // 处理const Name = IConWrapper(xxx)/IConWrapper(xxx)
        if (!useDefault) {
            this.write('const');
            this.space();
            this.write(pascalCase(this.name));
            this.space();
            this.write('=');
            this.space();
        }

        this.write(wrapperName);
        this.writeLine('(');
        this.indent(1);

        if (wrapperNeedName) {
            this.write('\'');
            this.write(this.name);
            this.write('\'');
            this.writeLine(',');
        }

        if (wrapperNeedRTL) {
            this.write(String(rtl));
            this.writeLine(',');
        }

        // 处理函数参数：(props: IIconProps)
        this.write('(');

        if (useHelper) {

            this.write(helperName);

            if (useType) {
                this.write(': ');
                this.write(this.getTypeName('helper'));
            }

            this.write(',');
            this.space();
        }

        this.write(propName);

        if (useType) {
            this.write(':');
            this.space();
            this.write(typeName);
        }

        this.write(')');
        this.space();

        // wrapper用箭头函数
        this.write('=>');
        this.space();
        this.writeLine('(');
        this.indent(1);
        this.processTag(info.element);
        this.indent(-1);
        this.write(')');

        if (style) {
            this.writeLine(',');
            this.write('(');
            this.write(stylePropName);

            if (useType) {
                this.write(': ');
                this.write(typeName);
            }

            this.write(')');
            this.write(' => ');
            this.processStyle(info.style);
            this.writeLine();
        } else {
            this.writeLine();
        }

        this.indent(-1);
        this.writeLine(');');

        return this.getResult();
    }

    public processTag(info: ISvgElementInfo): void {
        const {type, attrs, style, children} = info;
        this.write('<');
        this.write(type);

        attrs.forEach(item => this.processAttr(item));

        if (style.length) {
            this.processInlineStyle(style);
        }

        if (attrs.length) {
            this.writeLine();
        }

        if (children.length) {
            this.writeLine('>');
            this.indent(1);
            children.forEach(item => this.processTag(item));
            this.indent(-1);
            this.writeLine('</' + info.type + '>');
        } else {
            this.writeLine('/>');
        }
    }

    protected processAttr(attr: ISvgAttr): void {
        const {name, type, expression} = attr;
        this.writeLine('');
        this.indent(1);
        this.write(name);
        this.write('=');
        if (type === SvgShapeAttr.DYNAMIC) {
            this.write('{');
            this.write(expression);
            this.write('}');
        } else {
            this.write('"');
            this.write(expression);
            this.write('"');
        }
        this.indent(-1);
    }

    private processInlineStyle(exp: ISvgInlineStyleAttr[]): void {

        this.write(' style={{');

        exp.forEach(({name, expression, type}, index) => {
            this.write(name);
            this.write(':');
            this.space();

            if (type === SvgShapeAttr.DYNAMIC) {
                this.write(expression);
            } else {
                const nv = +expression;

                if (Number.isNaN(nv)) {
                    this.write('\'');
                    this.write(expression.replace(/'/g, '\\\''));
                    this.write('\'');
                } else {
                    this.write(expression);
                }
            }

            if (index !== exp.length - 1) {
                this.write(',');
                this.space();
            }
        });

        this.write('}}');
    }
}
