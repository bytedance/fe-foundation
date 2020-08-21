/**
 * @file RuntimeGenerator 生成运行时代码
*/
import {Generator, IGeneratorOptions} from '../Generator';
import {camelCase, pascalCase} from '../util';

export interface IIconColorHueInfo {

    type: 'hue';

    // 要替换的色度值
    hue: number;

    // 默认的对比度增益，可设置，用于展示在默认值上
    saturation: number;

    // 默认的明度增益，可设置，用于展示在默认值上
    light: number;
}

export interface IIconColorReplaceInfo {

    type: 'color';

    // 要替换的颜色和展示的默认颜色
    color: string;
}

export type IIconColorInfo = IIconColorHueInfo | IIconColorReplaceInfo;

export interface IThemeColorHue extends IIconColorHueInfo {

    // 在主题里的配置的名字
    name: string;

    // 是否为固定颜色，默认是false
    fixed?: boolean;
}

export interface IThemeColorReplace extends IIconColorReplaceInfo {

    // 在主题里的配置的名字
    name: string;

    // 是否为固定颜色，默认是false，为真的颜色无法改变
    fixed?: boolean;

    // 是否绑定为CurrentColor，设置为true的情况下，这个组件的默认值会直接使用CurrentColor而不是配置的颜色
    currentColor?: boolean;
}

export type IThemeColor = IThemeColorReplace | IThemeColorHue;

export interface IIconThemeInfo {

    name: string;

    // 可以填充的主题色
    fill: IThemeColor[];

    // 字符串传递固定颜色，数字为在fill里面的顺序，order的数量和顺序应该和colors里面一致
    order: number[];
}

export type StrokeLinecap = 'butt' | 'round' | 'square';

export type StrokeLinejoin = 'miter' | 'round' | 'bevel';

export interface IRuntimeOptions {
    // 是否导出类型
    useType?: boolean;
    colors?: IIconColorInfo[];
    prefix?: string;
    cssPrefix?: string;
    // 如果为number，为默认值，不传递或者为0的情况下，不处理stroke问题
    stroke?: number;
    strokeLinecap?: StrokeLinecap;
    strokeLinejoin?: StrokeLinejoin;
    theme?: IIconThemeInfo[];
    fixedSize?: boolean;
    style?: boolean;
}

export interface IRuntimeGeneratorOptions extends IGeneratorOptions, IRuntimeOptions {

    // 是否需要给Wrapper传递Name
    wrapperNeedName?: boolean;

    // 是否需要编译RTL属性
    wrapperNeedRTL?: boolean;
}

export abstract class RuntimeGenerator extends Generator {

    protected useType: boolean;

    protected colors: IIconColorInfo[];

    protected stroke: number;

    protected cssPrefix: string;

    protected theme: IIconThemeInfo[];

    protected fixedSize: boolean;

    protected style: boolean;
    protected wrapperNeedName: boolean;
    protected wrapperNeedRTL: boolean;

    protected hueList: IIconColorHueInfo[] = [];

    protected replaceList: IIconColorReplaceInfo[] = [];

    protected hasDefaultTheme: boolean;

    protected strokeLinecap?: StrokeLinecap;

    protected strokeLinejoin?: StrokeLinejoin;

    constructor(options: IRuntimeGeneratorOptions) {

        super(options);

        this.useType = options.useType || false;
        this.stroke = options.stroke || 0;
        this.cssPrefix = options.cssPrefix || 'sit';
        this.theme = options.theme || [];
        this.fixedSize = options.fixedSize || false;
        this.style = options.style || false;
        this.colors = options.colors || [];
        this.strokeLinecap = options.strokeLinecap;
        this.strokeLinejoin = options.strokeLinejoin;
        this.wrapperNeedName = options.wrapperNeedName || false;
        this.wrapperNeedRTL = options.wrapperNeedRTL || false;

        this.colors.forEach(item => {
            if (item.type === 'hue') {
                this.hueList.push(item);
            } else {
                this.replaceList.push(item);
            }
        });

        this.hasDefaultTheme = this.theme.some(item => item.fill.some(item => item.name));

    }

    public process(): string {

        // 写头部的注释
        this.processHeaderComment();

        // 添加外部引用
        this.processPlatformImports();

        if (this.useType) {

            // 定义常量类型
            this.processConstTypes();

            // 生成内部函数属性类型参数
            this.processSvgType();

            // 生成配置信息类型
            this.processConfigType();

            // 生成属性类型
            this.processPropsType();

            // 生成平台外部类型
            this.processPlatformTypes();
        }

        // 生成默认配置信息
        this.processConfigData();

        // 生成工具函数
        this.processUtil();

        // 生成转换函数代码
        this.processConverter();

        // 平台业务代码
        this.processPlatformCode();

        // 生成Wrapper代码
        this.processWrapper();

        return this.getResult();
    }

    protected abstract processPlatformImports(): void;

    protected abstract processPlatformTypes(): void;

    protected abstract processPlatformCode(): void;

    protected abstract processPlatformWrapper(): void;

    protected processConstTypes(): void {

        const {
            theme,
            hueList,
            strokeLinejoin,
            strokeLinecap
        } = this;

        // 描边连接类型
        if (strokeLinejoin) {
            this.writeLine('// 描边连接类型');
            this.writeLine('export type StrokeLinejoin = \'miter\' | \'round\' | \'bevel\';');
            this.writeLine();
        }

        // 描边端点类型
        if (strokeLinecap) {
            this.writeLine('// 描边端点类型');
            this.writeLine('export type StrokeLinecap = \'butt\' | \'round\' | \'square\';');
            this.writeLine();
        }

        // 主题
        if (theme.length) {
            this.writeLine('// 主题');
            this.writeLine(`export type Theme = ${theme.map(item => `'${item.name}'`).join(' | ')};`);
            this.writeLine();
        }

        // 渐变色处理
        if (hueList.length) {

            this.writeLine('// 渐变色格式化器');
            this.writeLine('export type HueReplaceFormatter = (idx: number, s: number, l: number) => string');

            this.writeLine();
            this.writeLine('// Hue类型');
            this.writeLine('export interface HSL {');
            this.indent(1);
            this.writeLine('h: number;');
            this.writeLine('s: number;');
            this.writeLine('l: number;');
            this.indent(-1);
            this.writeLine('}');
            this.writeLine();
        } else {
            this.writeLine();
        }
    }

    protected processSvgType(): void {

        const {replaceList, hueList} = this;

        this.writeLine('// 包裹前的图标属性');
        this.writeLine(`export interface ${this.getInterfaceName('props', true)} {`);
        this.indent(1);

        this.writeLine();
        this.writeLine('// 当前图标的唯一Id');
        this.writeLine('id: string;');
        this.processSvgCommonType();

        if (replaceList.length) {
            this.writeLine();
            this.writeLine('// 换肤的颜色数组');
            this.writeLine('colors: string[];');
        }

        if (hueList.length) {
            this.writeLine();
            this.writeLine('// 渐变换肤的替换函数');
            this.writeLine('format: HueReplaceFormatter;');
        }

        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    protected processConfigType(): void {

        this.writeLine('// 图标配置属性');
        this.writeLine(`export interface ${this.getInterfaceName('config')} {`);
        this.indent(1);

        this.processSvgCommonType();

        this.writeLine();
        this.writeLine('// CSS前缀');
        this.writeLine('prefix: string;');

        if (this.wrapperNeedRTL) {
            this.writeLine();
            this.writeLine('// RTL是否开启');
            this.writeLine('rtl: boolean;');
        }

        if (this.theme.length) {

            this.writeLine();
            this.writeLine('// 默认主题');
            this.writeLine('theme: Theme;');

            if (this.hasDefaultTheme) {

                this.writeLine();
                this.writeLine('// 主题默认颜色');
                this.writeLine('colors: {');
                this.indent(1);
                this.theme.forEach(item => {

                    if (!item.fill.some(item => item.name)) {
                        return;
                    }
                    this.writeLine();
                    this.writeLine(`${camelCase(item.name)}: {`);
                    this.indent(1);

                    item.fill.forEach(f => {

                        if (!f.name) {
                            return;
                        }

                        this.writeLine(`${camelCase(f.name)}: ${f.type === 'hue' ? 'HSL' : 'string'};`);
                    });
                    this.indent(-1);
                    this.writeLine('};');
                });
                this.indent(-1);
                this.writeLine('};');
            }
        } else if (this.colors.length) {

            const list: string[] = [];

            if (this.hueList.length) {
                list.push('HSL');
            }

            if (this.replaceList.length) {
                list.push('string');
            }

            this.writeLine();
            this.writeLine('// 默认颜色');

            if (list.length === 1) {
                this.writeLine(`colors: ${list.join(' | ')}[];`);
            } else {
                this.writeLine(`colors: Array<${list.join(' | ')}>;`);
            }
        }

        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    protected processPropsType(): void {

        this.writeLine('// 图标基础属性');
        this.writeLine(`export interface ${this.getInterfaceName('base')} {`);
        this.indent(1);

        this.processSvgCommonType(true);

        if (this.theme.length) {
            this.writeLine();
            this.writeLine('// 默认主题');
            this.writeLine('theme?: Theme;');
        }

        // 添加类型
        const list: string[] = this.getColorTypes();

        if (list.length > 0) {
            this.writeLine();
            this.writeLine('// 填充色');
            this.writeLine(`fill?: ${list.join(' | ')};`);
        }

        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    protected processSvgCommonType(optional: boolean = false): void {

        const {fixedSize, stroke, strokeLinecap, strokeLinejoin} = this;

        if (fixedSize) {
            this.writeLine();
            this.writeLine('// 图标尺寸大小，默认1em');
            this.writeLine(`size${optional ? '?' : ''}: number | string;`);
        } else {
            this.writeLine();
            this.writeLine('// 图标尺寸大小不固定，长宽默认为1em');
            this.writeLine(`width${optional ? '?' : ''}: number | string;`);
            this.writeLine(`height${optional ? '?' : ''}: number | string;`);
        }

        if (stroke) {
            this.writeLine();
            this.writeLine('// 描边宽度');
            this.writeLine(`strokeWidth${optional ? '?' : ''}: number;`);
        }

        if (strokeLinecap) {
            this.writeLine();
            this.writeLine('// 描边端点类型');
            this.writeLine(`strokeLinecap${optional ? '?' : ''}: StrokeLinecap;`);
        }

        if (strokeLinejoin) {
            this.writeLine();
            this.writeLine('// 描边连接线类型');
            this.writeLine(`strokeLinejoin${optional ? '?' : ''}: StrokeLinejoin;`);
        }
    }

    protected processConfigData(): void {

        const {cssPrefix, fixedSize, stroke, strokeLinejoin, strokeLinecap, useType, theme} = this;

        this.writeLine('// 默认属性');
        this.writeLine(`export const DEFAULT_${this.prefix.toUpperCase()}_CONFIGS`
            + (useType ? `: ${this.getInterfaceName('config')}` : '') + ' = {'
        );
        this.indent(1);

        if (fixedSize) {
            this.writeLine('size: \'1em\',');
        } else {
            this.writeLine();
            this.writeLine('// 图标尺寸大小不固定，长宽默认为1em');
            this.writeLine('width: \'1em\',');
            this.writeLine('height: \'1em\',');
        }

        if (stroke) {
            this.writeLine(`strokeWidth: ${stroke},`);
        }

        if (strokeLinecap) {
            this.writeLine(`strokeLinecap: '${strokeLinecap}',`);
        }

        if (strokeLinejoin) {
            this.writeLine(`strokeLinejoin: '${strokeLinejoin}',`);
        }

        if (this.wrapperNeedRTL) {
            this.writeLine('rtl: false,');
        }

        if (theme.length) {

            this.writeLine(`theme: '${theme[0].name}',`);

            if (this.hasDefaultTheme) {

                this.writeLine('colors: {');
                this.indent(1);
                this.theme
                    .filter(item => item.fill.some(item => item.name))
                    .forEach((item, i, arr) => {
                        this.writeLine(`${camelCase(item.name)}: {`);
                        this.indent(1);

                        item.fill
                            .filter(item => item.name)
                            .forEach((f, i, arr) => {

                                const name = f.name;

                                if (!name) {
                                    return;
                                }

                                if (f.type === 'hue') {
                                    this.writeLine(`${camelCase(name)}: {`);
                                    this.indent(1);
                                    this.writeLine(`h: ${f.hue},`);
                                    this.writeLine(`s: ${f.saturation},`);
                                    this.writeLine(`l: ${f.light}`);
                                    this.indent(-1);
                                    this.writeLine('}' + (i !== arr.length - 1 ? ',' : '')
                                    );
                                } else {
                                    this.writeLine(`${camelCase(name)}: '${f.color}'`
                                        + (i !== arr.length - 1 ? ',' : '')
                                    );
                                }
                            });
                        this.indent(-1);
                        this.writeLine(`}${i !== arr.length - 1 ? ',' : ''}`);
                    });
                this.indent(-1);
                this.writeLine('},');
            }
        } else if (this.colors.length) {
            this.writeLine('colors: [');
            this.indent(1);
            this.colors.forEach((f, i, arr) => {

                if (f.type === 'hue') {
                    this.writeLine('{');
                    this.indent(1);
                    this.writeLine(`h: ${f.hue},`);
                    this.writeLine(`s: ${f.saturation},`);
                    this.writeLine(`l: ${f.light}`);
                    this.indent(-1);
                    this.writeLine('}' + (i !== arr.length - 1 ? ',' : ''));
                } else {
                    this.writeLine(`'${f.color}'` + (i !== arr.length - 1 ? ',' : ''));
                }
            });
            this.indent(-1);
            this.writeLine('],');
        }

        this.writeLine(`prefix: '${cssPrefix}'`);
        this.indent(-1);
        this.writeLine('};');
        this.writeLine();
    }

    protected processUtil(): void {
        this.writeLine(`function guid()${this.useType ? `: ${this.getInterfaceName('config')}` : ''} {`);
        this.indent(1);
        this.writeLine(
            `return '${this.prefix}-' + (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);`
        );
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    protected processConverter(): void {

        this.writeLine('// 属性转换函数');

        if (this.useType) {
            this.writeLine(`export function ${pascalCase(this.prefix)}Converter`
                + `(id: string, icon: ${this.getInterfaceName('base')}, config: ${this.getInterfaceName('config')})`
                + `: ${this.getInterfaceName('props', true)} {`
            );
        } else {
            this.writeLine(`export function ${pascalCase(this.prefix)}Converter (id, icon, config) {`);
        }

        this.indent(1);
        this.writeLine();

        if (this.colors.length) {
            this.writeLine('const fill = typeof icon.fill === \'string\' ? [icon.fill] : icon.fill || [];');
        }

        if (this.replaceList.length) {
            if (this.useType) {
                this.writeLine('const colors: string[] = [];');
            } else {
                this.writeLine('const colors = [];');
            }
        }

        if (this.hueList.length) {

            if (this.useType) {
                this.writeLine('const hsl: HSL[] = [];');
            } else {
                this.writeLine('const hsl = [];');
            }
        }

        if (this.hasDefaultTheme) {

            this.writeLine();

            if (this.useType) {
                this.writeLine('const theme: Theme = icon.theme || config.theme;');
            } else {
                this.writeLine('const theme = icon.theme || config.theme;');
            }
            this.writeLine();
            this.writeLine('switch (theme) {');
            this.indent(1);

            this.theme.forEach(theme => {

                this.writeLine(`case '${theme.name}':`);
                this.indent(1);

                this.colors.forEach((color, i) => {

                    const order = theme.order[i];
                    const fill = theme.fill[order];

                    if (color.type === 'color') {

                        if (fill.type !== 'color') {
                            throw new Error('theme type and color type are diffent');
                        }

                        this.write('colors.push(');

                        // 固定颜色
                        if (fill.fixed) {
                            this.write(`'${fill.color}'`);
                        } else {
                            this.write(`typeof fill[${order}] === 'string' ? fill[${order}] : `);

                            if (fill.currentColor) {
                                this.write('\'currentColor\'');
                            } else {
                                this.write(`config.colors.${camelCase(theme.name)}.${camelCase(fill.name)}`);
                            }
                        }

                        this.writeLine(');');
                    } else {

                        if (fill.type !== 'hue') {
                            throw new Error('theme type and color type are diffent');
                        }

                        this.write('hsl.push(');

                        // 固定颜色
                        if (fill.fixed) {
                            this.write(`{h: ${fill.hue}, s: ${fill.saturation}, l: ${fill.light}`);
                        } else {
                            this.write(`typeof fill[${order}] === 'object' ? fill[${order}] : `);
                            this.write(`config.colors.${camelCase(theme.name)}.${camelCase(fill.name)}`);
                        }

                        this.writeLine(');');
                    }
                });
                this.writeLine('break;');
                this.indent(-1);
            });
            this.indent(-1);
            this.writeLine('}');
        } else if (this.colors.length) {

            this.colors.forEach((fill, order) => {

                if (fill.type === 'color') {

                    this.writeLine();
                    this.writeLine(`if (typeof fill[${order}] === 'string') {`);
                    this.indent(1);
                    this.writeLine(`colors.push(fill[${order}]);`);
                    this.indent(-1);
                    this.writeLine();
                    this.writeLine('} else {');
                    this.indent(1);
                    this.writeLine();
                    this.writeLine(`if (typeof config.colors[${order}] !== 'string') {`);
                    this.indent(1);
                    this.writeLine(`throw new Error('config.colors[${order}] expect string to be HSL');`);
                    this.indent(-1);
                    this.writeLine('}');
                    this.writeLine();
                    this.writeLine(`colors.push(config.colors[${order}]);`);
                    this.indent(-1);
                    this.writeLine('}');
                } else {
                    this.writeLine();
                    this.writeLine('if (typeof fill[${order}] === \'string\') {');
                    this.indent(1);
                    this.writeLine(`hsl.push(fill[${order}]);`);
                    this.indent(-1);
                    this.writeLine();
                    this.writeLine('} else {');
                    this.indent(1);
                    this.writeLine();
                    this.writeLine(`if (typeof config.colors[${order}] !== 'object') {`);
                    this.indent(1);
                    this.writeLine(`throw new Error('config.colors[${order}] expect HSL to be string');`);
                    this.indent(-1);
                    this.writeLine('}');
                    this.writeLine();
                    this.writeLine(`hsl.push(config.colors[${order}]);`);
                    this.indent(-1);
                    this.writeLine('}');
                }
            });
        }

        this.writeLine();
        this.writeLine('return {');
        this.indent(1);

        if (this.fixedSize) {
            this.writeLine('size: icon.size || config.size,');
        } else {
            this.writeLine();
            this.writeLine('// 图标尺寸大小不固定，长宽默认为1em');
            this.writeLine('width: icon.width || config.width,');
            this.writeLine('height: icon.height || config.height,');
        }

        if (this.stroke) {
            this.writeLine('strokeWidth: icon.strokeWidth || config.strokeWidth,');
        }

        if (this.strokeLinecap) {
            this.writeLine('strokeLinecap: icon.strokeLinecap || config.strokeLinecap,');
        }

        if (this.strokeLinejoin) {
            this.writeLine('strokeLinejoin: icon.strokeLinejoin || config.strokeLinejoin,');
        }

        if (this.replaceList.length) {
            this.writeLine('colors,');
        }

        if (this.hueList.length) {
            this.writeLine('format: (idx, s , l) => {');
            this.writeLine('},');
        }

        this.writeLine('id');
        this.indent(-1);
        this.writeLine('};');

        this.indent(-1);
        this.writeLine('}');
        this.writeLine();
    }

    protected processWrapper(): void {

        this.writeLine('// 图标Wrapper');
        this.write(
            `export function ${this.getTypeName('wrapper')}(`
        );

        if (this.wrapperNeedName) {
            if (this.useType) {
                this.write('name: string, ');
            } else {
                this.write('name, ');
            }
        }

        if (this.wrapperNeedRTL) {
            if (this.useType) {
                this.write('rtl: boolean, ');
            } else {
                this.write('rtl, ');
            }
        }

        if (this.useType) {
            this.write(`render: ${this.getTypeName('Render')}`);
        } else {
            this.write('render');
        }

        if (this.style) {

            this.write(', ');

            if (this.useType) {
                this.write(`cssRender?: ${this.getInterfaceName('props', true)}`);
            } else {
                this.write('cssRender');
            }
        }

        if (this.useType) {
            this.writeLine('): ' + this.getTypeName('') + ' {');
        } else {
            this.writeLine(') {');
        }

        this.indent(1);
        // 生成平台Wrapper代码
        this.processPlatformWrapper();
        this.indent(-1);
        this.writeLine('}');
    }

    protected getPropKeys(): string[] {

        const arr: string[] = [];
        const {fixedSize, stroke, hueList, replaceList, strokeLinecap, strokeLinejoin} = this;

        if (fixedSize) {
            arr.push('size');
        } else {
            arr.push('width', 'height');
        }

        if (stroke) {
            arr.push('strokeWidth');
        }

        if (strokeLinecap) {
            arr.push('strokeLinecap');
        }

        if (strokeLinejoin) {
            arr.push('strokeLinejoin');
        }

        if (this.theme.length) {
            arr.push('theme');
        }

        if (hueList.length || replaceList.length) {
            arr.push('fill');
        }

        return arr;
    }

    protected getClassName(key?: string): string {
        const {cssPrefix, prefix} = this;
        return `'${cssPrefix}-${prefix}${key ? '-' + key : ''}'`;
    }

    protected getColorTypes(): string[] {

        // 添加类型
        const list: string[] = [];

        if (this.hueList.length) {
            list.push('HSL');
        }

        if (this.replaceList.length) {
            list.push('string');
        }

        if (list.length === 1) {
            list.push(list[0] + '[]');
        } else if (list.length > 1) {
            list.push(
                `Array<${list.join(' | ')}>`
            );
        }

        return list;
    }
}
