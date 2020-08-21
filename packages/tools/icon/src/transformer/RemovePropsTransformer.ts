/**
 * @file RemovePropsTransformer 删除属性
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr} from '../types';

export interface IRemovePropsTransformerOptions {
    props: string[];
}

export function RemovePropsTransformer(options: IRemovePropsTransformerOptions): ITransformPlugin {

    const props = options.props;

    return {
        '*': {
            attr(attr: ISvgAttr): ISvgAttr | null {

                const {name, type, expression, owner} = attr;

                if (props.indexOf(name) >= 0) {
                    return null;
                }

                return {name, expression, type, owner};
            }
        }
    };
}
