/**
 * @file RemoveTagsTransformer 删除标签
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgElementInfo} from '../types';

export interface IRemoveTagsTransformerOptions {
    tags: string[];
}

export function RemoveTagsTransformer(options: IRemoveTagsTransformerOptions): ITransformPlugin {

    const tags = options.tags;

    return {
        '*': {
            enter(info: ISvgElementInfo): ISvgElementInfo | null {

                const {type, children, attrs, parent, style} = info;

                // svg标签不能被删除
                if (type !== 'svg' && tags.indexOf(type) >= 0) {
                    return null;
                }

                return {type, children, attrs, parent, style};
            }
        }
    };
}
