/**
 * @file CamelTransformer 将属性转化成驼峰命名
*/

import {ITransformPlugin} from '../Transformer';
import {ISvgAttr, ISvgInlineStyleAttr} from '../types';
import {camelCase} from '../util';

export interface ICamelTransformerOptions {
    namespace?: boolean;
    styleOnly?: boolean;
}

export function CamelTransformer(options: ICamelTransformerOptions): ITransformPlugin {

    const namespace = options.namespace || false;
    const styleOnly = options.styleOnly || false;

    return {
        '*': {
            attr(attr: ISvgAttr): ISvgAttr | null {

                const {name, type, expression, owner} = attr;

                if (styleOnly) {
                    return attr;
                }

                return {
                    name: camelCase(name, namespace ? '-:' : '-'),
                    type,
                    expression,
                    owner
                };
            },
            style(attr: ISvgInlineStyleAttr): ISvgInlineStyleAttr | null {

                const {name, type, expression, owner} = attr;

                return {
                    name: camelCase(name, namespace ? '-:' : '-'),
                    type,
                    expression,
                    owner
                };
            }
        }
    };
}
