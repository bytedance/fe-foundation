/**
 * @file SvgRuntimeGenerator 生成SVG运行时代码
*/
import {RuntimeGenerator} from './RuntimeGenerator';

export class SvgRuntimeGenerator extends RuntimeGenerator {

    protected processPlatformImports(): void {
    }

    protected processPlatformTypes(): void {

        this.writeLine('// 包裹后的图标非扩展属性');
        this.writeLine(`export type ${this.getInterfaceName('')} = ${this.getInterfaceName('base')};`);
        this.writeLine();

        this.writeLine('// 包裹后的图标属性');
        this.writeLine(`export type ${this.getInterfaceName('props')} = ${this.getInterfaceName('base')};`);

        this.writeLine();
        this.writeLine('// 包裹前的图标');
        this.writeLine(
            `export type ${this.getTypeName('Render')} = `
            + `(props: ${this.getInterfaceName('props', true)}) => string;`
        );

        this.writeLine();
        this.writeLine('// 包裹后的图标');
        this.writeLine(
            `export type ${this.getTypeName('')} = (props: ${this.getInterfaceName('props')}) => string;`
        );

        this.writeLine();
    }

    protected processPlatformCode(): void {

        const config = this.getInterfaceName('config');

        this.writeLine('// 图标配置');
        this.writeLine(`let currentConfig = DEFAULT_${this.prefix.toUpperCase()}_CONFIGS;`);
        this.writeLine();
        this.writeLine(`export function setConfig(config: ${config}): void {`);
        this.indent(1);
        this.writeLine('currentConfig = config;');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
        this.writeLine(`export function getConfig(): ${config} {`);
        this.indent(1);
        this.writeLine('return currentConfig;');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    // eslint-disable-next-line max-statements
    protected processPlatformWrapper(): void {
        this.writeLine();
        this.writeLine(`return (props: ${this.getInterfaceName('props')}) => {`);
        this.indent(1);
        this.writeLine();
        this.writeLine('const config = getConfig();');
        this.writeLine();
        this.writeLine(`const svgProps = ${this.getTypeName('converter')}(guid(), props, config);`);
        this.writeLine();
        this.writeLine('return render(svgProps);');
        this.writeLine();
        this.indent(-1);
        this.writeLine('};');
    }
}
