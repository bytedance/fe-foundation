/**
 * @file DynamicTransformer 将动态属性转化成静态属性
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, ISvgStyleAttr, SvgShapeAttr} from '../types';

export interface IDynamicStrokeTransformerOptions {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;
    disableStroke?: boolean;
    disableStrokeLinecap?: boolean;
    disableStrokeLinejoin?: boolean;
    strokeWidthName?: string;
    strokeLinecapName?: string;
    strokeLinejoinName?: string;
}

function dynamicStrokeTransformer<T extends ISvgAttr | ISvgStyleAttr>(
    attr: T,
    options: IDynamicStrokeTransformerOptions
): T | null {

    const {
        prefix = false,
        propName = 'props',
        disableStroke = false,
        disableStrokeLinecap = false,
        disableStrokeLinejoin = false,
        strokeWidthName = 'strokeWidth',
        strokeLinecapName = 'strokeLinecap',
        strokeLinejoinName = 'strokeLinejoin'
    } = options;

    const {name, type} = attr;

    // 不处理动态属性
    if (type === SvgShapeAttr.DYNAMIC) {
        return attr;
    }

    switch (name) {
        case 'stroke-width':

            if (disableStroke) {
                return attr;
            }

            return Object.assign({}, attr, {
                type: SvgShapeAttr.DYNAMIC,
                expression: (prefix ? propName + '.' : '') + strokeWidthName
            });

        case 'stroke-linecap':

            if (disableStrokeLinecap) {
                return attr;
            }

            return Object.assign({}, attr, {
                type: SvgShapeAttr.DYNAMIC,
                expression: (prefix ? propName + '.' : '') + strokeLinecapName
            });

        case 'stroke-linejoin':

            if (disableStrokeLinejoin) {
                return attr;
            }

            return Object.assign({}, attr, {
                type: SvgShapeAttr.DYNAMIC,
                expression: (prefix ? propName + '.' : '') + strokeLinejoinName
            });
    }

    return attr;
}

export function DynamicStrokeTransformer(options: IDynamicStrokeTransformerOptions): ITransformPlugin {

    return {
        '*': {
            attr: attr => dynamicStrokeTransformer(attr, options),
            style: attr => dynamicStrokeTransformer(attr, options)
        },
        'rule': {
            attr: attr => dynamicStrokeTransformer(attr, options)
        }
    };
}
