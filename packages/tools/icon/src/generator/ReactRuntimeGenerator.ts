/**
 * @file ReactRuntimeGenerator 生成React运行时代码
*/
import {RuntimeGenerator} from './RuntimeGenerator';

export class ReactRuntimeGenerator extends RuntimeGenerator {

    protected processPlatformImports(): void {

        if (this.useType) {
            this.writeLine('import React, {HTMLAttributes, ReactElement, createContext,'
                + ' useContext, useMemo} from \'react\';'
            );
        } else {
            this.writeLine('import React, {createContext, useContext, useMemo} from \'react\';');
        }

        this.writeLine();
    }

    protected processPlatformTypes(): void {

        // 交集类型
        this.writeLine('// 安全的类型合并');
        this.writeLine('export type Intersection<T, K> = T & Omit<K, keyof T>;');
        this.writeLine();

        this.writeLine('// 包裹后的图标非扩展属性');
        this.writeLine(
            `export interface ${this.getInterfaceName('')} extends ${this.getInterfaceName('base')} {`
        );
        this.indent(1);
        this.writeLine('spin?: boolean;');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();

        this.writeLine('// 包裹后的图标属性');
        this.writeLine(
            `export type ${this.getInterfaceName('props')} = `
            + `Intersection<${this.getInterfaceName('')}, HTMLAttributes<HTMLSpanElement>>;`
        );

        this.writeLine();
        this.writeLine('// 包裹前的图标');
        this.writeLine(
            `export type ${this.getTypeName('Render')} = `
            + `(props: ${this.getInterfaceName('props', true)}) => ReactElement;`
        );

        this.writeLine();
        this.writeLine('// 包裹后的图标');
        this.writeLine(
            `export type ${this.getTypeName('')} = (props: ${this.getInterfaceName('props')}) => ReactElement;`
        );

        this.writeLine();
    }

    protected processPlatformCode(): void {

        const contextName = this.getTypeName('context');

        this.writeLine('// 图标配置Context');
        this.writeLine(`const ${contextName} `
            + `= createContext(DEFAULT_${this.prefix.toUpperCase()}_CONFIGS);`
        );
        this.writeLine();
        this.writeLine('// 图标配置Provider');
        this.writeLine(`export const ${this.getTypeName('provider')} = ${contextName}.Provider;`);
        this.writeLine();
    }

    // eslint-disable-next-line max-statements
    protected processPlatformWrapper(): void {

        const {wrapperNeedName, wrapperNeedRTL} = this;

        this.writeLine();

        if (this.useType) {
            this.writeLine(`return (props: ${this.getInterfaceName('props')}) => {`);
        } else {
            this.writeLine('return (props) => {');
        }

        this.indent(1);
        this.writeLine();
        this.writeLine('const {');
        this.indent(1);
        this.getPropKeys().forEach(key => {
            this.writeLine(key + ',');
        });
        this.writeLine('className,');
        this.writeLine('spin,');
        this.writeLine('...extra');
        this.indent(-1);
        this.writeLine('} = props;');
        this.writeLine();
        this.writeLine(`const config = useContext(${this.getTypeName('context')});`);
        this.writeLine();

        this.writeLine('const id = useMemo(guid, []);');
        this.writeLine();

        this.writeLine(`const svgProps = ${this.getTypeName('converter')}(id, {`);
        this.indent(1);
        this.getPropKeys().forEach((key, index, {length}) => {
            this.writeLine(key + (index !== length - 1 ? ',' : ''));
        });
        this.indent(-1);
        this.writeLine('}, config);');
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
            this.writeLine('if (rtl && config.rtl) {');
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
        this.writeLine('if (className) {');
        this.indent(1);
        this.writeLine('cls.push(className);');
        this.indent(-1);
        this.writeLine('}');

        this.writeLine();
        this.writeLine('return (');
        this.indent(1);
        this.writeLine('<span {...extra} className={cls.join(\' \')}>');
        this.indent(1);
        this.writeLine('{render(svgProps)}');
        this.indent(-1);
        this.writeLine('</span>');
        this.indent(-1);
        this.writeLine(');');
        this.indent(-1);
        this.writeLine('};');
    }
}
