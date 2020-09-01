/**
 * @file LessGenerator

 */

import {Generator, IGeneratorOptions} from '../Generator';

export interface ILessGeneratorOptions extends IGeneratorOptions {

    // 图标数组
    prefix: string;

    cssPrefix: string;
}

export class LessGenerator extends Generator {

    protected prefix: string;

    protected cssPrefix: string;

    constructor(options: ILessGeneratorOptions) {

        super(options);

        this.prefix = options.prefix;
        this.cssPrefix = options.cssPrefix;
    }

    public process(): string {

        // 写头部的注释
        this.processHeaderComment();

        const {prefix, cssPrefix} = this;
        this.writeLine(`.${cssPrefix}-${prefix} {`);
        this.indent(1);
        this.writeLine('display: inline-block;');
        this.writeLine('color: inherit;');
        this.writeLine('font-style: normal;');
        this.writeLine('line-height: 0;');
        this.writeLine('text-align: center;');
        this.writeLine('text-transform: none;');
        this.writeLine('vertical-align: -0.125em;');
        this.writeLine('text-rendering: optimizeLegibility;');
        this.writeLine('-webkit-font-smoothing: antialiased;');
        this.writeLine('-moz-osx-font-smoothing: grayscale;');
        this.writeLine();
        this.writeLine('&-spin svg {');
        this.indent(1);
        this.writeLine(`animation: ${cssPrefix}-${prefix}-spin 1s infinite linear;`);
        this.indent(-1);
        this.writeLine('}');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();

        this.writeLine(`@keyframes ${cssPrefix}-${prefix}-spin {`);
        this.indent(1);
        this.writeLine('100% {');
        this.indent(1);
        this.writeLine('-webkit-transform: rotate(360deg);');
        this.writeLine('transform: rotate(360deg)');
        this.indent(-1);
        this.writeLine('}');
        this.indent(-1);
        this.writeLine('}');
        this.writeLine();

        this.writeLine(`@-webkit-keyframes ${cssPrefix}-${prefix}-spin {`);
        this.indent(1);
        this.writeLine('100% {');
        this.indent(1);
        this.writeLine('-webkit-transform: rotate(360deg);');
        this.writeLine('transform: rotate(360deg)');
        this.indent(-1);
        this.writeLine('}');
        this.indent(-1);
        this.writeLine('}');

        this.writeLine();

        return this.getResult();
    }

}
