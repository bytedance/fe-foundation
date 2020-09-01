/**
 * @file ReplaceKeyframesIdTransformer
*/
import {ITransformPlugin} from '../Transformer';
import {
    IReplaceIdTransformerOptions, ISvgAttr,
    ISvgInlineStyleAttr,
    ISvgStyleAttr,
    SvgShapeAttr,
    SvgStyleSelectorType
} from '../types';
import {replaceAnimation, splitAnimation} from '../util';
import {replaceSelectorIdTransformer} from './ReplaceIdTransformer';

function replaceKeyframesId<T extends ISvgAttr | ISvgStyleAttr>(attr: T, map: IReplaceIdTransformerOptions): T | null {

    const {type, expression, name} = attr;

    if (type === SvgShapeAttr.DYNAMIC) {
        return attr;
    }

    if (name === 'animation-name') {

        const list = expression
            .split(',')
            .map(item => item.trim())
            .map(item => `${map[item].propName} + '${map[item].newId}'`);

        return {
            ...attr,
            type: SvgShapeAttr.DYNAMIC,
            expression: list.join(' + \',\' + ')
        };
    }

    if (name === 'animation') {

        const list = splitAnimation(expression);
        let has = false;
        const res: string[] = [];

        list.forEach(key => {

            const r = replaceAnimation(key);

            if (r == null) {
                res.push('\'' + key + '\'');
                return;
            }
            has = true;
            res.push('\'' + replaceStr(key, r, `' + ${map[r].propName} + '${map[r].newId}' + '`) + '\'');
        });

        if (!has) {
            return attr;
        }

        if (res.length === 1) {
            return {
                ...attr,
                type: SvgShapeAttr.DYNAMIC,
                expression: res[0]
            };
        }

        return {
            ...attr,
            type: SvgShapeAttr.DYNAMIC,
            expression: res.join(' + \',\' + ')
        };
    }

    return attr;
}

export function ReplaceKeyframesIdTransformer(map: IReplaceIdTransformerOptions): ITransformPlugin {
    return {
        rule: {
            attr: (attr: ISvgStyleAttr): ISvgStyleAttr | null => replaceKeyframesId(attr, map)
        },
        '*': {
            style: (attr: ISvgInlineStyleAttr): ISvgInlineStyleAttr | null => replaceKeyframesId(attr, map)
        },
        'keyframes': {
            selector: attr => replaceSelectorIdTransformer(attr, map, SvgStyleSelectorType.IDENTIFIER)
        }
    };
}

function replaceStr(str: string, sp: string, replace: string): string {

    const list = str.split(sp);
    const result: string[] = [];

    list.forEach((item, i) => {

        if (i === 0) {
            result.push(item);
        } else if (i !== list.length - 1) {
            result.push(sp);
            result.push(item);
        } else {
            result.push(replace);
            result.push(item);
        }
    });

    return result.join('');
}
