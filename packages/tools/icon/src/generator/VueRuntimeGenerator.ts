/**
 * @file VueRuntimeGenerator 生成Vue运行时代码
 */
import {RuntimeGenerator} from './RuntimeGenerator';

export class VueRuntimeGenerator extends RuntimeGenerator {

    protected processPlatformImports(): void {
        if (this.useType) {
            this.writeLine('import Vue, {ComponentOptions, CreateElement, VNode, VueConstructor} from \'vue\';');
            this.writeLine(
                'import {ArrayPropsDefinition, DefaultComputed, DefaultData, DefaultMethods} '
                + 'from \'vue/types/options\';'
            );
        } else {
            this.writeLine('import React, {createContext, useContext, useMemo} from \'react\';');
        }

        this.writeLine();
    }

    protected processPlatformTypes(): void {

        this.writeLine('// 包裹后的图标属性');
        this.writeLine(
            `export interface ${this.getInterfaceName('props')} extends ${this.getInterfaceName('base')} {`
        );
        this.indent(1);
        this.writeLine('spin?: boolean;');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();

        this.writeLine('// 渲染Help函数属性');
        this.writeLine(
            `export type ${this.getTypeName('helper')} = CreateElement;`
        );
        this.writeLine();

        const instance = this.getInterfaceName('instance');

        this.writeLine();
        this.writeLine('// 包裹前的图标实例');
        this.writeLine(
            `export interface ${instance} extends Vue, ${this.getInterfaceName('props')} {`
        );
        this.indent(1);
        this.writeLine('id: string;');
        this.writeLine(`${this.prefix.toUpperCase()}_CONFIGS?: ${this.getInterfaceName('config')};`);
        this.indent(-1);
        this.writeLine('}');

        this.writeLine();
        this.writeLine('// 包裹后的图标属性');
        this.writeLine('// eslint-disable-next-line max-len');
        this.writeLine(
            `export type ${this.getTypeName('options')} = `
            + `ComponentOptions<${instance}, DefaultData<{id: string}>, DefaultMethods<never>, `
            + `DefaultComputed, ArrayPropsDefinition<${this.getInterfaceName('props')}>, `
            + `${this.getInterfaceName('props')}>;`
        );

        this.writeLine();
        this.writeLine('// 包裹前的图标渲染器');
        this.writeLine(
            `export type ${this.getTypeName('Render')} = `
            + `(h: ${this.getTypeName('helper')}, props: ${this.getInterfaceName('props', true)}) => VNode;`
        );

        this.writeLine();
        this.writeLine('// 包裹后的图标');
        this.writeLine(
            `export type ${this.getTypeName('')} = VueConstructor<${instance}>;`
        );

        this.writeLine();
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected processPlatformCode(): void {
    }

    protected processPlatformWrapper(): void {

        const {prefix, wrapperNeedName, wrapperNeedRTL} = this;

        this.writeLine();
        this.writeLine(`const options: ${this.getTypeName('options')} = {`);
        this.indent(1);

        // 处理name
        this.writeLine(`name: '${prefix}-' + name,`);

        // 处理inject
        this.writeLine(`inject: ['${this.prefix.toUpperCase()}_CONFIGS'],`);

        // 处理属性
        this.writeLine(`props: [${this.getPropKeys().map(item => `'${item}'`).join(', ')}, 'spin'],`);

        // 处理数据
        this.writeLine('data() {');
        this.indent(1);
        this.writeLine('return {id: guid()};');
        this.indent(-1);
        this.writeLine('},');

        // 继承属性
        this.writeLine('inheritAttrs: false,');

        // 渲染函数
        this.writeLine(`render(this: ${this.getInterfaceName('instance')}, h: CreateElement): VNode {`);
        this.indent(1);

        // 解构变量
        this.writeLine();
        this.writeLine('const {');
        this.indent(1);
        this.getPropKeys().forEach(key => {
            this.writeLine(key + ',');
        });
        this.writeLine('id,');
        this.writeLine('spin,');
        this.writeLine(`${this.prefix.toUpperCase()}_CONFIGS = DEFAULT_${this.prefix.toUpperCase()}_CONFIGS`);
        this.indent(-1);
        this.writeLine('} = this;');
        this.writeLine();

        // 生成渲染属性
        this.writeLine(`const svgProps = ${this.getTypeName('converter')}(id, {`);
        this.indent(1);
        this.getPropKeys().forEach((key, index, {length}) => {
            this.writeLine(key + (index !== length - 1 ? ',' : ''));
        });
        this.indent(-1);
        this.writeLine(`}, ${this.prefix.toUpperCase()}_CONFIGS);`);
        this.writeLine();

        // 生成className
        if (this.useType) {
            this.writeLine(`const cls: string[] = [${this.getClassName()}];`);
        } else {
            this.writeLine(`const cls = [${this.getClassName()}];`);
        }

        if (wrapperNeedName) {
            this.writeLine();
            this.writeLine(`cls.push(${this.getClassName()} + '-' + name);`);
        }

        if (wrapperNeedRTL) {
            this.writeLine();
            this.writeLine(`if (rtl && ${this.prefix.toUpperCase()}_CONFIGS.rtl) {`);
            this.indent(1);
            this.writeLine(`cls.push(${this.getClassName('rtl')});`);
            this.indent(-1);
            this.writeLine('}');
        }

        this.writeLine();
        this.writeLine('if (spin) {');
        this.indent(1);
        this.writeLine(`cls.push(${this.getClassName('spin')});`);
        this.indent(-1);
        this.writeLine('}');

        this.writeLine();
        this.writeLine('return (');
        this.indent(1);
        this.writeLine('<span class={cls.join(\' \')}>');
        this.indent(1);
        this.writeLine('{render(h, svgProps)}');
        this.indent(-1);
        this.writeLine('</span>');
        this.indent(-1);
        this.writeLine(');');

        this.indent(-1);
        this.writeLine('}');

        this.indent(-1);
        this.writeLine('};');

        this.writeLine();
        this.writeLine(`return options as ${this.getTypeName('')};`);
    }

}
