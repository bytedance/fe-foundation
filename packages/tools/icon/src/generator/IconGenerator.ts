/**
 * @file IconGenerator 图标基础生成器
*/
import {Generator} from '../Generator';
import {
    ISvgInfo,
    ISvgStyleAttr,
    ISvgStyleInfo,
    ISvgStyleKeyframesInfo,
    ISvgStyleRuleInfo,
    ISvgStyleSelector,
    SvgShapeAttr,
    SvgStyleSelectorType
} from '../types';

export abstract class IconGenerator extends Generator {

    public abstract process(info: ISvgInfo): string;

    // 获取处理结果
    protected getResult(): string {
        return this.result;
    }

    protected processStyle(style: ISvgStyleInfo): void {
        const old = this.indentSize;
        this.indentSize = 0;
        this.writeLine('`');
        style.keyframes.forEach(rule => this.processStyleKeyframe(rule));
        style.rules.forEach(rule => this.processStyleRule(rule));
        this.write('`');
        this.indentSize = old;
    }

    protected processStyleKeyframe(rule: ISvgStyleKeyframesInfo): void {
        const {name, selector, rules} = rule;

        this.writeLine(`@${name} ${selector.type === SvgShapeAttr.CONST
            ? selector.expression
            : '${' + selector.expression + '}'
        } {`);
        this.indent(1);
        rules.forEach(item => this.processStyleRule(item));
        this.indent(-1);
        this.writeLine('}');
    }

    protected processStyleRule(rule: ISvgStyleRuleInfo): void {
        const {selector, attrs} = rule;
        this.writeLine(`${this.calcStyleSelectorGroup(selector)} {`);
        this.indent(1);
        attrs.forEach(attr => this.processStyleAttr(attr));
        this.indent(-1);
        this.writeLine('}');
    }

    protected calcStyleSelectorGroup(selector: ISvgStyleSelector[][]): string {
        return selector.map(item => this.calcStyleSelectorList(item)).join(', ');
    }

    protected calcStyleSelectorList(selector: ISvgStyleSelector[]): string {
        return selector.map(item => this.calcStyleSelector(item)).join('');
    }

    protected calcStyleSelector(selector: ISvgStyleSelector): string {

        const {selectorType, expression, type} = selector;

        // TODO
        if (selectorType === SvgStyleSelectorType.NOT) {
            return selectorType;
        }

        if (type === SvgShapeAttr.CONST) {
            return expression;
        }

        return `\${${expression}}`;
    }

    protected processStyleAttr(attr: ISvgStyleAttr): void {

        const {type, expression, name} = attr;

        if (type === SvgShapeAttr.CONST) {
            this.writeLine(`${name}: ${expression};`);
            return;
        }

        this.writeLine(`${name}: \${${expression}};`);
    }
}
