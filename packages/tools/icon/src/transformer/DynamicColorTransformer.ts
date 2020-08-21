/**
 * @file DynamicColorTransformer 将静态的颜色识别成变量
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, ISvgElementInfo, ISvgStyleAttr, SvgShapeAttr} from '../types';
import {isColorEqual} from '../util';

export interface IDynamicColorTransformerArray {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;

    // 为true的时候，props上只有一个参数
    array: true;

    // 数组的键名
    prop?: string;

    // 要匹配的颜色数组
    colors: string[];

    // 忽略的元素
    ignore?: (info: ISvgElementInfo) => boolean;
}

export interface IDynamicColorTransformerField {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;

    // 不使用数组
    array?: false;

    // 颜色和属性对应表
    colors: Array<{color: string; prop: string}>;

    // 忽略的元素
    ignore?: (info: ISvgElementInfo) => boolean;
}

export type IDynamicColorTransformerOptions = IDynamicColorTransformerArray | IDynamicColorTransformerField;

function dynamicColorTransformer<T extends ISvgAttr | ISvgStyleAttr>(
    attr: T,
    options: IDynamicColorTransformerOptions,
    ignore: boolean = false
): T | null {
    const prefix = options.prefix || false;
    const colors: Array<{color: string; prop: string}> = options.array
        ? options.colors.map((item, i) => ({
            color: item,
            prop: (options.prop || 'colors') + '[' + i + ']'
        }))
        : options.colors;

    const {name, type, expression} = attr;

    // 不处理动态属性，不处理忽略的元素
    if (type === SvgShapeAttr.DYNAMIC || !ignore) {
        return attr;
    }

    if (name === 'stroke' || name === 'fill') {

        const color = colors.find(item => isColorEqual(item.color, expression));

        if (color != null) {
            return {
                ...attr,
                type: SvgShapeAttr.DYNAMIC,
                expression: (prefix ? (options.propName || 'props') + '.' : '') + color.prop
            };
        }
    }

    return attr;
}

export function DynamicColorTransformer(options: IDynamicColorTransformerOptions): ITransformPlugin {

    return {
        '*': {
            attr: attr => dynamicColorTransformer(attr, options, !(options.ignore && options.ignore(attr.owner))),
            style: attr => dynamicColorTransformer(attr, options, true)
        },

        'rule': {
            attr: attr => dynamicColorTransformer(attr, options, true)
        }
    };
}
