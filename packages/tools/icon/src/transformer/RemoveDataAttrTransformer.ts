/**
 * @file RemoveDataAttrTransformer 删除data-属性
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr} from '../types';

export function RemoveDataAttrTransformer(): ITransformPlugin {

    return {
        '*': {
            attr(attr: ISvgAttr): ISvgAttr | null {

                const {name} = attr;

                if (name.startsWith('data-')) {
                    return null;
                }

                return attr;
            }
        }
    };
}
