/**
 * @file compiler 编译函数
*/

import {Generator} from './Generator';
import {Parser} from './Parser';
import {ITransformPlugin, Transformer} from './Transformer';

export interface ICompilerOptions {
    content: string;
    plugins: ITransformPlugin[];
    generator: Generator;
}

/**
 * 编译函数
 *
 * @param options 配置信息
 */
export function compiler(options: ICompilerOptions): string {

    const parser = new Parser(options.content);
    const info = parser.process();
    const transformer = new Transformer({
        info,
        plugins: options.plugins
    });

    const transformed = transformer.process();

    return options.generator.process(transformed);
}

export interface IColorConvertHueInfo {
    type: 'hue';
    hue: number;
}
