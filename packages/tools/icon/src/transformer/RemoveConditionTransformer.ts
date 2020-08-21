/**
 * @file RemoveConditionTransformer 根据条件删除元素
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgElementInfo} from '../types';

export interface IRemoveConditionTransformerOptions {
    tag?: string;
    condition: (info: ISvgElementInfo) => boolean;
}

export function RemoveConditionTransformer(options: IRemoveConditionTransformerOptions): ITransformPlugin {

    const {condition} = options;

    return {
        '*': {
            enter(info: ISvgElementInfo): ISvgElementInfo | null {

                const remove = condition(info);

                return remove ? null : info;
            }
        }
    };
}
