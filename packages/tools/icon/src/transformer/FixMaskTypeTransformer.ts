/**
 * @file FixMaskTypeTransformer 修复MaskType错误
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgElementInfo} from '../types';

export function FixMaskTypeTransformer(): ITransformPlugin {

    return {
        mask: {
            enter(element: ISvgElementInfo): ISvgElementInfo | null {

                const index = element.attrs.findIndex(item => item.name === 'mask-type');

                if (index >= 0) {

                    const [attr] = element.attrs.splice(index, 1);
                    const cssIndex = element.style.findIndex(item => item.name === 'mask-type');

                    if (cssIndex < 0) {

                        element.style.push({
                            owner: attr.owner,
                            type: attr.type,
                            name: attr.name,
                            expression: attr.expression
                        });
                    }
                }

                return element;
            }
        }
    };
}
