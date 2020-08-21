/**
 * @file GetKeyframesIdTransformer
*/
import {ITransformPlugin} from '../Transformer';
import {ISvgStyleSelector, SvgStyleSelectorType} from '../types';

const excludeSelectorMap: Record<string, boolean> = {
    unset: true,
    initial: true,
    inherit: true,
    none: true
};

export function GetKeyframesIdTransformer(map: { [key: string]: boolean }): ITransformPlugin {
    return {
        'keyframes': {
            selector(attr: ISvgStyleSelector): ISvgStyleSelector {
                const {selectorType, expression} = attr;

                if (excludeSelectorMap[expression]) {
                    throw new Error(`Keyframe name could not be ${expression}`);
                }

                if (selectorType === SvgStyleSelectorType.IDENTIFIER) {
                    map[expression] = true;
                }

                return attr;
            }
        }
    };
}
