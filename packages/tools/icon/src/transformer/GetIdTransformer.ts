/**
 * @file GetIdTransformer 获取元素Id的映射
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, ISvgStyleSelector, SvgStyleSelectorType} from '../types';

export function GetIdTransformer(map: { [key: string]: boolean }): ITransformPlugin {

    return {
        '*': {
            attr(attr: ISvgAttr): ISvgAttr {

                if (attr.name === 'id') {
                    map[attr.expression] = true;
                }

                return attr;
            }
        },

        'rule': {
            selector(attr: ISvgStyleSelector): ISvgStyleSelector {
                if (attr.selectorType === SvgStyleSelectorType.ID) {
                    map[attr.expression.slice(1)] = true;
                }

                return attr;
            }
        }
    };
}
