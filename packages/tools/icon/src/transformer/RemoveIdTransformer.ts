/**
 * @file RemoveIdTransformer 删除对应的Id
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr} from '../types';

export interface IRemoveIdTransformerOptions {
    propName: string;
    ids: string[];
    removeAll?: boolean;
}

export function RemoveIdTransformer(options: IRemoveIdTransformerOptions): ITransformPlugin {

    const {propName, ids, removeAll = false} = options;
    const map: {[key: string]: boolean} = {};

    ids.forEach(id => map[`${propName} + '${id}'`] = true);

    return {
        '*': {
            attr(attr: ISvgAttr): ISvgAttr | null {

                if (attr.name !== 'id') {
                    return attr;
                }

                if (removeAll) {
                    return null;
                }

                if (map[attr.expression]) {
                    return null;
                }

                return attr;
            }
        }
    };
}
