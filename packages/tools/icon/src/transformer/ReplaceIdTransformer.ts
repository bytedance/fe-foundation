/**
 * @file RemoveIdTransformer 删除对应的Id
*/

import {ITransformPlugin} from '../Transformer';
import {
    IReplaceIdTransformerOptions, ISvgAttr, ISvgStyleAttr, ISvgStyleSelector, SvgShapeAttr, SvgStyleSelectorType
} from '../types';

export const REFERENCE_PROPS = {
    'clip-path': true,
    'color-profile': true,
    'fill': true,
    'filter': true,
    'marker-start': true,
    'marker-mid': true,
    'marker-end': true,
    'mask': true,
    'stroke': true
};

function replaceAttrIdTransformer<T extends ISvgAttr | ISvgStyleAttr>(
    attr: T,
    map: IReplaceIdTransformerOptions
): T | null {

    const {name, type, expression} = attr;

    // 不处理动态属性
    if (type === SvgShapeAttr.DYNAMIC) {
        return attr;
    }

    if (name in REFERENCE_PROPS && /url\(#([^)]+)\)/g.test(expression)) {
        return {
            ...attr,
            type: SvgShapeAttr.DYNAMIC,
            expression: expression.replace(/url\(#([^)]+)\)/g, (str: string, e: string) => {

                if (map[e]) {
                    map[e].used = true;
                    return `'url(#' + ${map[e].propName} + '${map[e].newId}' + ')'`;
                }

                // 引用的外部Id
                return str;
            })
        };
    }

    return attr;
}

export function replaceSelectorIdTransformer(
    attr: ISvgStyleSelector,
    map: IReplaceIdTransformerOptions,
    targetSelectorType: SvgStyleSelectorType
): ISvgStyleSelector | null {
    const {type, expression, selectorType} = attr;

    if (type === SvgShapeAttr.DYNAMIC) {
        return attr;
    }

    if (selectorType === targetSelectorType) {

        if (targetSelectorType === SvgStyleSelectorType.ID) {

            map[expression.slice(1)].used = true;

            return {
                ...attr,
                type: SvgShapeAttr.DYNAMIC,
                expression: `'#' + ${map[expression.slice(1)].propName} + '${map[expression.slice(1)].newId}'`
            };
        }

        return {
            ...attr,
            type: SvgShapeAttr.DYNAMIC,
            expression: `${map[expression].propName} + '${map[expression].newId}'`
        };
    }

    return attr;
}

export function ReplaceIdTransformer(map: IReplaceIdTransformerOptions): ITransformPlugin {

    return {

        '*': {
            attr(attr: ISvgAttr): ISvgAttr | null {

                const {name, type, expression} = attr;

                if (type === SvgShapeAttr.DYNAMIC) {
                    return attr;
                }

                if (name === 'id') {
                    return {
                        ...attr,
                        type: SvgShapeAttr.DYNAMIC,
                        expression: `${map[expression].propName} + '${map[expression].newId}'`
                    };
                }

                if (name === 'role' || name === 'xlink:href' || name === 'href' || name === 'arcrole') {

                    const e = expression.slice(1);

                    if (expression.charAt(0) === '#' && map[e]) {

                        map[e].used = true;

                        return {
                            ...attr,
                            type: SvgShapeAttr.DYNAMIC,
                            expression: `'#' + ${map[e].propName} + '${map[e].newId}'`
                        };
                    }

                    // 引用的外部Id
                    return attr;
                }

                return replaceAttrIdTransformer(attr, map);
            },
            style: attr => replaceAttrIdTransformer(attr, map)
        },
        'rule': {
            attr: attr => replaceAttrIdTransformer(attr, map),
            selector: attr => replaceSelectorIdTransformer(attr, map, SvgStyleSelectorType.ID)
        }
    };
}
