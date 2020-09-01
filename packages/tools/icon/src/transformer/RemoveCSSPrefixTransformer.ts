/**
 * @file RemoveCSSPrefixTransformer 删除前缀CSS
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgInlineStyleAttr, ISvgStyleAttr} from '../types';

export function RemoveCSSPrefixTransformer(): ITransformPlugin {

    return {
        '*': {
            style(attr: ISvgInlineStyleAttr): ISvgInlineStyleAttr | null {

                const {name} = attr;

                if (name.startsWith('-')) {
                    return null;
                }

                return attr;
            }
        },
        rule: {
            attr(attr: ISvgStyleAttr): ISvgStyleAttr | null {

                const {name} = attr;

                if (name.startsWith('-')) {
                    return null;
                }

                return attr;
            }
        }
    };
}
