/**
 * @file IconCompiler 图标编译工具
*/
import {compiler} from './compiler';
import {IndexGenerator} from './generator/IndexGenerator';
import {LessGenerator} from './generator/LessGenerator';
import {ReactRuntimeGenerator} from './generator/ReactRuntimeGenerator';
import {SvgRuntimeGenerator} from './generator/SvgRuntimeGenerator';
import {VueRuntimeGenerator} from './generator/VueRuntimeGenerator';
import {pascalCase} from './util';

import {DynamicColorTransformer} from './transformer/DynamicColorTransformer';
import {RemoveConditionTransformer} from './transformer/RemoveConditionTransformer';
import {RemoveTagsTransformer} from './transformer/RemoveTagsTransformer';
import {RemovePropsTransformer} from './transformer/RemovePropsTransformer';
import {RemoveDataAttrTransformer} from './transformer/RemoveDataAttrTransformer';
import {DynamicSizeTransformer} from './transformer/DynamicSizeTransformer';
import {DynamicStrokeTransformer} from './transformer/DynamicStrokeTransformer';
import {UniqueIdTransformer} from './transformer/UniqueIdTransformer';
import {UniqueKeyframesIdTransformer} from './transformer/UniqueKeyframesIdTransformer';
import {RemoveCSSPrefixTransformer} from './transformer/RemoveCSSPrefixTransformer';
import {CamelTransformer} from './transformer/CamelTransformer';
import {DynamicHueTransformer} from './transformer/DynamicHueTransformer';
import {SyncGroupProps} from './transformer/SyncGroupProps';
import {ITransformPlugin} from './Transformer';

import {
    IIconColorHueInfo,
    IIconColorReplaceInfo,
    IRuntimeGeneratorOptions,
    IRuntimeOptions
} from './generator/RuntimeGenerator';
import {IconGenerator} from './generator/IconGenerator';
import {JSXGenerator} from './generator/JSXGenerator';
import {SvgGenerator} from './generator/SvgGenerator';
import {FixMaskTypeTransformer} from './transformer/FixMaskTypeTransformer';

export interface IIconToolsOptions extends IRuntimeOptions {
    author: string;
    type: 'react' | 'vue' | 'svg';
}

export type IconCompilerFunc = (info: IIconInfo) => string;

export interface IIconFile {
    path: string;
    mime: string;
    content: string;
}

export interface IIconInfo {
    name: string;
    content: string;
    description?: string;
    rtl?: boolean;
}

export class IconCompiler {

    public static instance(options: IIconToolsOptions): IconCompiler {
        return new IconCompiler(options);
    }

    private readonly options: IIconToolsOptions;

    private readonly map: Record<string, string> = {};

    private readonly compiler: IconCompilerFunc;

    private readonly runtimeCode: string;

    private constructor(options: IIconToolsOptions) {
        this.options = options;
        this.compiler = this.createCompiler();
        this.runtimeCode = this.createRuntimeCode();
    }

    public appendIcon(info: IIconInfo): void {
        this.map[info.name] = this.compiler(info);
    }

    public getIconCode(name: string): string {

        const svg = this.map[name];

        if (!this.map[name]) {
            throw new Error('call `this.appendIcon(' + name + ')` first');
        }

        return svg;
    }

    public getIconFile(name: string): IIconFile {

        const svg = this.getIconCode(name);
        const {type, useType} = this.options;
        const isSvg = type === 'svg';

        return {
            mime: 'image/svg+xml',
            path: `icons/${pascalCase(name)}.${useType ? 'ts' : 'js'}${isSvg ? '' : 'x'}`,
            content: svg
        };
    }

    public getIconFiles(): IIconFile[] {

        const list = Object.keys(this.map).map(key => this.getIconFile(key));

        list.push(this.getRuntimeFile(), this.getIndexFile());

        if (this.options.type !== 'svg') {
            list.push(this.getLessFile());
        }

        return list;
    }

    public getRuntimeCode(): string {
        return this.runtimeCode;
    }

    public getRuntimeFile(): IIconFile {
        return {
            mime: 'text/javascript',
            path: `runtime/index.${this.options.useType ? 'ts' : 'js'}x`,
            content: this.getRuntimeCode()
        };
    }

    public getLessCode(): string {

        const {author, prefix = 'icon', cssPrefix = 'sit'} = this.options;

        const generator = new LessGenerator({
            name: 'index',
            author,
            nameDisplayType: 'camel',
            description: '样式文件',
            prefix,
            cssPrefix
        });

        return generator.process();
    }

    public getLessFile(): IIconFile {
        return {
            mime: 'text/css',
            path: 'runtime/index.less',
            content: this.getLessCode()
        };
    }

    public getIndexFile(): IIconFile {
        return {
            mime: 'text/javascript',
            path: 'index.' + (this.options.useType ? 'ts' : 'js'),
            content: this.getIndexCode()
        };
    }

    public getIndexCode(): string {

        const {author, useType = false} = this.options;

        const generator = new IndexGenerator({
            name: 'index',
            author,
            nameDisplayType: 'camel',
            description: '引用出口',
            useType,
            icons: Object.keys(this.map)
        });

        return generator.process();
    }

    private createCompiler(): IconCompilerFunc {

        const {
            options: {
                type,
                colors = [],
                stroke = 0,
                fixedSize = false,
                style = false,
                strokeLinecap,
                strokeLinejoin
            }
        } = this;

        const hueList: IIconColorHueInfo[] = [];

        const replaceList: IIconColorReplaceInfo[] = [];

        colors.forEach(item => {
            if (item.type === 'hue') {
                hueList.push(item);
            } else {
                replaceList.push(item);
            }
        });

        const isSvg = type === 'svg';

        return ({name, content, description = name, rtl = false}) => {

            const plugins: ITransformPlugin[] = [];

            // 删除无用的标签
            plugins.push(RemoveTagsTransformer({tags: ['title', 'desc', 'a', 'metadata']}));

            // 删除掉无用的属性（当生成目标是react时，xmlns无效）
            plugins.push(RemovePropsTransformer({
                props: ['version', 'xmlns:xlink'].concat(isSvg ? [] : ['xmlns'])
            }));

            // 修复mask-type属性的错误
            plugins.push(FixMaskTypeTransformer());

            // data开头的属性无用
            plugins.push(RemoveDataAttrTransformer());

            // 增加动态颜色替换，一定要在Hue替换之前
            if (replaceList.length) {
                plugins.push(DynamicColorTransformer({
                    prefix: true,
                    array: true,
                    colors: replaceList.map(item => item.color),
                    ignore: info => info.attrs.some(item => (
                        item.name === 'fill-opacity' && item.expression === '0.01')
                    )
                }));
            }

            // 增加动态颜色替换
            if (hueList.length) {
                plugins.push(DynamicHueTransformer({
                    prefix: true,
                    hueList: hueList.map(item => item.hue),
                    forceReplaceColor: false
                }));
            }

            // 删除多余的ID
            plugins.push(UniqueIdTransformer({prefix: true, removeUnuseIds: true}));

            // 处理CSS动画
            if (style) {
                plugins.push(UniqueKeyframesIdTransformer({prefix: true}));
                plugins.push(RemoveCSSPrefixTransformer());
            }

            // size处理
            plugins.push(DynamicSizeTransformer({
                prefix: true,
                widthName: fixedSize ? 'size' : 'width',
                heightName: fixedSize ? 'size' : 'height'
            }));

            // 处理描边
            plugins.push(DynamicStrokeTransformer({
                prefix: true,
                disableStroke: !stroke,
                disableStrokeLinejoin: !strokeLinejoin,
                disableStrokeLinecap: !strokeLinecap
            }));

            // 处理额外增加的Rect
            if (!isSvg) {
                plugins.push(RemoveConditionTransformer({
                    tag: 'rect',
                    condition: info => info.attrs.some(item => (
                        item.name === 'fill-opacity' && item.expression === '0.01')
                    )
                }));
            }

            if (isSvg) {
                plugins.push(SyncGroupProps({
                    attrNames: ['stroke-linecap', 'stroke-linejoin', 'stroke-width', 'stroke', 'fill', 'fill-rule']
                }));
            }

            // React需要进行变量名升级
            if (type === 'react') {
                plugins.push(CamelTransformer({namespace: true}));
            }

            let generator: IconGenerator = type === 'vue'
                ? this.createVueGenerator(name, description, rtl)
                : type === 'react'
                    ? this.createReactGenerator(name, description, rtl)
                    : this.createSvgGenerator(name, description);

            return compiler({
                content,
                plugins,
                generator
            });
        };
    }

    private createSvgGenerator(name: string, description: string): SvgGenerator {

        const {
            author,
            style = false,
            prefix = 'icon',
            useType = false
        } = this.options;

        return new SvgGenerator({
            name,
            author,
            nameDisplayType: 'pascal',
            useDefault: true,
            useType,
            style,
            prefix,
            wrapperNeedName: true,
            wrapperNeedRTL: false,
            description,
            rtl: false,
            importPath: '../runtime'
        });
    }

    private createReactGenerator(name: string, description: string, rtl: boolean): JSXGenerator {

        const {
            author,
            style = false,
            prefix = 'icon',
            useType = false
        } = this.options;

        return new JSXGenerator({
            name,
            author,
            rtl,
            nameDisplayType: 'pascal',
            useDefault: true,
            useType,
            style,
            prefix,
            wrapperNeedName: true,
            wrapperNeedRTL: true,
            extraImport: ['import React from \'react\';'],
            description,
            importPath: '../runtime'
        });
    }

    private createVueGenerator(name: string, description: string, rtl: boolean): JSXGenerator {

        const {
            author,
            style = false,
            prefix = 'icon',
            useType = false
        } = this.options;

        return new JSXGenerator({
            name,
            author,
            rtl,
            prefix,
            nameDisplayType: 'pascal',
            useDefault: true,
            useType,
            useHelper: true,
            wrapperNeedName: true,
            wrapperNeedRTL: true,
            style,
            description,
            importPath: '../runtime'
        });
    }

    private createRuntimeCode(): string {

        const {
            author,
            type,
            colors = [],
            prefix = 'icon',
            stroke = 0,
            theme = [],
            fixedSize = false,
            style = false,
            cssPrefix = 'sit',
            strokeLinecap,
            strokeLinejoin,
            useType = false

        } = this.options;

        const baseOptions: IRuntimeGeneratorOptions = {
            name: 'runtime',
            author,
            nameDisplayType: 'camel',
            description: '运行时',
            useType,
            colors,
            prefix,
            cssPrefix,
            stroke,
            theme,
            fixedSize,
            style,
            strokeLinecap,
            strokeLinejoin,
            wrapperNeedName: true
        };

        const generator = type === 'vue'
            ? new VueRuntimeGenerator({
                ...baseOptions,
                wrapperNeedRTL: true
            })
            : type === 'svg'
                ? new SvgRuntimeGenerator({
                    ...baseOptions
                })
                : new ReactRuntimeGenerator({
                    ...baseOptions,
                    wrapperNeedRTL: true
                });

        return generator.process();
    }
}
