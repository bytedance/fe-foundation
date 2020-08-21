/**
 * @file DynamicSizeTransformer 动态大小替换
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, SvgShapeAttr} from '../types';

export interface IDynamicSizeTransformerOptions {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;

    widthName?: string;
    heightName?: string;
}

export function DynamicSizeTransformer(options: IDynamicSizeTransformerOptions): ITransformPlugin {

    const {
        prefix = false,
        propName = 'props',
        widthName = 'width',
        heightName = 'height'
    } = options;

    return {
        svg: {
            attr(attr: ISvgAttr): ISvgAttr | null {

                const {name, type, expression, owner} = attr;

                // 不处理动态属性
                if (type === SvgShapeAttr.DYNAMIC) {
                    return {name, type, expression, owner};
                }

                if (name === 'width') {
                    return {
                        name,
                        type: SvgShapeAttr.DYNAMIC,
                        expression: (prefix ? propName + '.' : '') + widthName,
                        owner
                    };
                }

                if (name === 'height') {
                    return {
                        name,
                        type: SvgShapeAttr.DYNAMIC,
                        expression: (prefix ? propName + '.' : '') + heightName,
                        owner
                    };
                }

                return {name, type, expression, owner};
            }
        }
    };
}
