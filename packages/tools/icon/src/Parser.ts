/**
 * @file Parser 解析器
*/

import {Attributes, Element, xml2js} from 'xml-js';
import csstree, {Atrule, CssNode, Declaration, DeclarationList, Raw, Rule, StyleSheet} from 'css-tree';
import {
    ISvgAttr,
    ISvgElementInfo,
    ISvgInfo,
    ISvgInlineStyleAttr,
    ISvgStyleAttr,
    ISvgStyleKeyframesInfo,
    ISvgStyleRuleInfo,
    SvgShapeAttr,
    SvgStyleSelectorType,
    SvgStyleType,
    SvgTags
} from './types';
import {tokenize} from './tokenize';

/**
 * 解析器
 *
 */
export class Parser {

    protected content: string;

    protected element: ISvgElementInfo = {
        type: 'svg',
        attrs: [],
        style: [],
        children: [],
        parent: null
    };

    protected keyframs: ISvgStyleKeyframesInfo[] = [];

    protected styleRules: ISvgStyleRuleInfo[] = [];

    constructor(content: string) {
        this.content = content;
    }

    public process(): ISvgInfo {

        const json = xml2js(this.content, {
            compact: false,
            ignoreDeclaration: true,
            ignoreInstruction: true,
            ignoreComment: true,
            ignoreCdata: true,
            ignoreDoctype: true,
            ignoreText: false
        });

        this.element = this.processElement(json.elements[0], null) as ISvgElementInfo;

        return this.getResult();
    }

    // 处理一个元素
    protected processElement(elem: Element, parent: ISvgElementInfo | null): ISvgElementInfo | null {

        const type = elem.name || '';

        if (type === 'style') {
            this.processStyle(elem);
            return null;
        }

        if (elem.type !== 'element') {
            return null;
        }

        const info: ISvgElementInfo = {
            parent,
            type: type as SvgTags,
            attrs: [],
            style: [],
            children: []
        };

        const [attrs, styleAttrs] = this.processAttr(elem, info);
        info.attrs = attrs;
        info.style = styleAttrs;
        info.children = this.processChildren(elem, info);

        return info;
    }

    // 处理提取属性
    protected processAttr(elem: Element, owner: ISvgElementInfo): [ISvgAttr[], ISvgInlineStyleAttr[]] {

        const attrs: ISvgAttr[] = [];
        const styleAttrs: ISvgInlineStyleAttr[] = [];
        const map: Attributes = elem.attributes || {};

        Object.keys(map).forEach(key => {

            const value = map[key];

            if (value != null) {

                if (key === 'style') {
                    styleAttrs.push(...this.processInlineStyle(value as string, owner));
                    return;
                }

                attrs.push({
                    name: key,
                    type: SvgShapeAttr.CONST,
                    expression: value + '',
                    owner
                });
            }
        });

        return [attrs, styleAttrs];
    }

    protected processChildren(elem: Element, parent: ISvgElementInfo): ISvgElementInfo[] {

        const children: ISvgElementInfo[] = [];

        if (elem.elements == null) {
            return children;
        }

        elem.elements.forEach(element => {
            const elem = this.processElement(element, parent);

            if (elem) {
                children.push(elem);
            }
        });

        return children;
    }

    protected processStyle(elem: Element): void {

        const children: Element[] = elem.elements || [];

        children.forEach(child => {

            if (child.type === 'text') {
                const json = csstree.parse(String(child.text), {
                    parseAtrulePrelude: false,
                    parseRulePrelude: false,
                    parseValue: false
                }) as StyleSheet;

                this.processStyleRule(json.children.toArray());
            }
        });
    }

    protected processInlineStyle(text: string, owner: ISvgElementInfo): ISvgInlineStyleAttr[] {
        const json = csstree.parse(text, {
            context: 'declarationList',
            parseValue: false
        }) as DeclarationList;

        return json.children.toArray().map(item => this.processInlineStyleAttr(item as Declaration, owner));
    }

    protected processStyleRule(rules: CssNode[]): void {
        rules.forEach(rule => {
            if (rule.type === 'Atrule' && rule.name === 'keyframes') {
                this.keyframs.push(this.processKeyframesRule(rule));
            } else if (rule.type === SvgStyleType.Rule) {
                this.styleRules.push(this.processRule(rule));
            }
        });
    }

    protected processKeyframesRule(rule: Atrule): ISvgStyleKeyframesInfo {
        const {block, prelude} = rule;
        const res: ISvgStyleKeyframesInfo = {
            styleType: SvgStyleType.Keyframes,
            type: SvgShapeAttr.CONST,
            name: 'keyframes',
            selector: {
                selectorType: SvgStyleSelectorType.IDENTIFIER,
                type: SvgShapeAttr.CONST,
                expression: (prelude as Raw).value,
                children: []
            },
            rules: []
        };

        if (!block) {
            return res;
        }

        block.children.toArray().forEach(item => {
            res.rules.push(this.processRule(item as Rule, true));
        });

        return res;
    }

    protected processRule(rule: Rule, isKeyframe: boolean = false): ISvgStyleRuleInfo {

        const {prelude, block} = rule;
        const value = (prelude as Raw).value;

        const res: ISvgStyleRuleInfo = {
            styleType: SvgStyleType.Rule,
            type: SvgShapeAttr.CONST,
            selector: isKeyframe ? [[{
                selectorType: SvgStyleSelectorType.IDENTIFIER,
                type: SvgShapeAttr.CONST,
                expression: value,
                children: []
            }]] : tokenize(value),
            attrs: []
        };

        if (!block) {
            return res;
        }

        block.children.toArray().forEach(item => {
            res.attrs.push(this.processStyleAttr(item as Declaration, res));
        });

        return res;
    }

    protected processStyleAttr(rule: Declaration, owner: ISvgStyleRuleInfo): ISvgStyleAttr {
        const {value, property} = rule;

        return {
            name: property,
            type: SvgShapeAttr.CONST,
            expression: (value as Raw).value,
            owner
        };
    }

    protected processInlineStyleAttr(rule: Declaration, owner: ISvgElementInfo): ISvgInlineStyleAttr {
        const {value, property} = rule;

        return {
            name: property,
            type: SvgShapeAttr.CONST,
            expression: (value as Raw).value,
            owner
        };
    }

    protected getResult(): ISvgInfo {
        return {
            element: this.element,
            style: {
                keyframes: this.keyframs,
                rules: this.styleRules
            }
        };
    }
}
