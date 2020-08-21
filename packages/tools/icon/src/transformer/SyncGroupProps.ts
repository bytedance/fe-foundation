/**
 * @file SyncGroupProps 同步Group属性
 */

import {ITransformPlugin} from '../Transformer';
import {ISvgElementInfo} from '../types';

export interface ISyncGroupPropsTransformerOptions {
    attrNames: string[];
}

export function closest(info: ISvgElementInfo, tag: string): ISvgElementInfo | null {

    let elem: ISvgElementInfo | null = info.parent;

    while (elem != null) {

        if (elem.type === tag) {
            return elem;
        }

        elem = elem.parent;
    }

    return null;
}

export function SyncGroupProps(options: ISyncGroupPropsTransformerOptions): ITransformPlugin {

    const {
        attrNames = []
    } = options;

    return {
        '*': {
            enter(info: ISvgElementInfo): ISvgElementInfo | null {

                const g = closest(info, 'g');

                if (g == null) {
                    return info;
                }

                const attrs = info.attrs.slice();

                attrNames.forEach(name => {

                    const infoAttrIndex = attrs.findIndex(item => item.name === name);
                    const gAttrIndex = g.attrs.findIndex(item => item.name === name);

                    // 自己没有，但是父元素有，则添加
                    if (infoAttrIndex < 0 && gAttrIndex >= 0) {
                        attrs.push({
                            ...g.attrs[gAttrIndex]
                        });
                    }
                });

                return {
                    ...info,
                    attrs
                };

            }
        },
        'g': {
            exit(info: ISvgElementInfo): ISvgElementInfo | null {

                const attrs = info.attrs.slice();

                attrNames.forEach(name => {

                    const gAttrIndex = attrs.findIndex(item => item.name === name);

                    if (gAttrIndex >= 0) {
                        attrs.splice(gAttrIndex, 1);
                    }
                });

                return {
                    ...info,
                    attrs
                };
            }
        }
    };
}
