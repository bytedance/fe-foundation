/**
 * @file IndexGenerator
*/

import {Generator, IGeneratorOptions} from '../Generator';
import {pascalCase} from '../util';

export interface IIndexGeneratorOptions extends IGeneratorOptions {

    // 是否导出类型
    useType?: boolean;

    // 图标数组
    icons: string[];
}

export class IndexGenerator extends Generator {

    protected useType: boolean;

    protected icons: string[];

    constructor(options: IIndexGeneratorOptions) {

        super(options);

        this.useType = options.useType || false;
        this.icons = options.icons;
    }

    public process(): string {

        // 写头部的注释
        this.processHeaderComment();

        this.icons.forEach(name => {
            this.writeLine(`export {default as ${pascalCase(name)}} from './icons/${pascalCase(name)}';`);
        });

        return this.getResult();
    }

}
