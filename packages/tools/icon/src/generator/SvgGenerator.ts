/**
 * @file SvgGenerator 输出Svg函数代码
*/

import {IGeneratorOptions} from '../Generator';
import {ISvgAttr, ISvgElementInfo, ISvgInfo, ISvgInlineStyleAttr, ISvgStyleInfo, SvgShapeAttr} from '../types';
import {pascalCase} from '../util';
import {IconGenerator} from './IconGenerator';

export interface ISvgGeneratorOptions extends IGeneratorOptions {

    // 是否使用默认导出
    useDefault?: boolean;

    // 是否导出类型
    useType?: boolean;

    // 是否导出style
    style?: boolean;

    // 是否需要给Wrapper传递Name
    wrapperNeedName?: boolean;

    // 是否需要编译RTL属性
    wrapperNeedRTL?: boolean;

    // 当前组件在rtl时是否需要翻转
    rtl?: boolean;

    // 引用路径
    importPath?: string;

}

export class SvgGenerator extends IconGenerator {

    protected useDefault: boolean;
    protected useType: boolean;
    protected style: boolean;
    protected wrapperNeedName: boolean;
    protected importPath: string;
    protected rtl: boolean;
    protected wrapperNeedRTL: boolean;

    constructor(options: ISvgGeneratorOptions) {

        super(options);

        this.useDefault = options.useDefault || false;
        this.useType = options.useType || false;
        this.style = options.style || false;
        this.wrapperNeedName = options.wrapperNeedName || false;
        this.importPath = options.importPath || '../runtime';
        this.rtl = options.rtl || false;
        this.wrapperNeedRTL = options.wrapperNeedRTL || false;
    }

    // eslint-disable-next-line max-statements
    public process(info: ISvgInfo): string {

        const {
            useDefault,
            useType,
            wrapperNeedName,
            wrapperNeedRTL,
            rtl,
            importPath
        } = this;

        this.processHeaderComment();
        this.writeLine('/* tslint:disable: max-line-length */');
        this.writeLine('/* eslint-disable max-len */');

        // 处理顶部引用import {IIconType, IconWrapper} from '../components/icon'
        this.write('import');
        this.space();
        this.write('{');

        const imports: string[] = [];
        const typeName = this.getInterfaceName('props', true);
        const wrapperName = this.getTypeName('wrapper');

        if (useType) {
            imports.push(typeName);
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
        this.write('(');
        if (wrapperNeedName) {
            this.write('\'');
            this.write(this.name);
            this.write('\'');
            this.write(', ');
        }

        if (wrapperNeedRTL) {
            this.write(String(rtl));
            this.write(', ');
        }

        // 处理函数参数：(props: IIconProps)
        this.write('(');
        this.write('props');

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
        this.writeLine('\'<?xml version="1.0" encoding="UTF-8"?>\'');
        this.processTag(info.element, info.style);
        this.indent(-1);
        this.write(')');
        this.writeLine(');');

        return this.getResult();
    }

    public processTag(info: ISvgElementInfo, css: ISvgStyleInfo): void {
        const {type, attrs, style, children} = info;
        this.write('+ \'');
        this.write('<');
        this.write(type);

        attrs.forEach(item => this.processAttr(item));

        if (style.length) {
            this.processInlineStyle(style);
        }

        if (type === 'svg' && this.style || children.length) {
            this.writeLine('>\'');
            this.indent(1);

            if (type === 'svg' && this.style) {
                this.writeLine('+ \'<style>\' + ');
                this.processStyle(css);
                this.writeLine(' + \'</style>\'');
            }

            children.forEach(item => this.processTag(item, css));
            this.indent(-1);
            this.writeLine('+ \'</' + type + '>\'');
            return;
        }
        this.writeLine('/>\'');
    }

    protected processAttr(attr: ISvgAttr): void {
        const {name, type, expression} = attr;
        this.write(' ');
        this.write(name);
        this.write('="');

        if (type === SvgShapeAttr.DYNAMIC) {
            this.write('\' + ' + expression + ' + \'');
        } else {
            this.write(expression);
        }

        this.write('"');
    }

    private processInlineStyle(exp: ISvgInlineStyleAttr[]): void {

        this.write(' style="');

        exp.forEach(({name, expression, type}, index) => {
            this.write(name);
            this.write(':');
            this.space();

            if (type === SvgShapeAttr.DYNAMIC) {
                this.write('\' + ' + expression + ' + \'');
            } else {
                this.write(expression);
            }

            if (index !== exp.length - 1) {
                this.write(',');
                this.space();
            }
        });

        this.write('"');
    }
}
