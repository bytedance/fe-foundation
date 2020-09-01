/**
 * @file DynamicHueTransformer 动态替换Hue
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, ISvgInlineStyleAttr, ISvgStyleAttr, SvgShapeAttr} from '../types';
import {color2Hsl} from '../util';

export interface IDynamicHueTransformerOptions {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // 格式化颜色的函数名字
    formatter?: string;

    // prefix前缀的名字
    propName?: string;

    // 要匹配的颜色数组
    hueList: number[];

    // 强制将没找到的颜色，替换成第一个颜色
    forceReplaceColor?: boolean;
}

export const COLOR_PROPS = {
    'color': true,
    'fill': true,
    'stroke': true,
    'stop-color': true,
    'flood-color': true,
    'lighting-color': true
};

function converter<T extends ISvgAttr | ISvgInlineStyleAttr | ISvgStyleAttr>(
    options: IDynamicHueTransformerOptions, attr: T
): T | null {

    const {
        prefix,
        propName,
        formatter = 'format',
        hueList,
        forceReplaceColor = false
    } = options;

    const {name, type, expression} = attr;
    const prefixStr = prefix ? (propName || 'props') + '.' : '';

    // 不处理动态属性
    if (type === SvgShapeAttr.DYNAMIC) {
        return attr;
    }

    if (name in COLOR_PROPS) {

        const color = color2Hsl(expression);

        if (color != null) {

            const {h, s, l} = color;
            const hue = Math.round(h);
            const saturation = +s.toFixed(4);
            const lightness = +l.toFixed(4);
            const index = hueList.indexOf(hue);

            // 不处理白色
            if (s === 0 && l === 1) {
                return attr;
            }

            // 没匹配到的颜色不处理
            if (index < 0 && !forceReplaceColor) {
                return attr;
            }

            const hueStr = String(index >= 0 ? index : 0);

            return {
                ...attr,
                name,
                type: SvgShapeAttr.DYNAMIC,
                expression: `${prefixStr}${formatter}(${hueStr}, ${saturation}, ${lightness})`
            };
        }
    }

    return attr;
}

export function DynamicHueTransformer(options: IDynamicHueTransformerOptions): ITransformPlugin {
    return {
        '*': {
            attr: (attr: ISvgAttr): ISvgAttr | null => converter(options, attr),
            style: (attr: ISvgInlineStyleAttr): ISvgInlineStyleAttr | null => converter(options, attr)
        },
        rule: {
            attr: (attr: ISvgStyleAttr): ISvgStyleAttr | null => converter(options, attr)
        }
    };
}
