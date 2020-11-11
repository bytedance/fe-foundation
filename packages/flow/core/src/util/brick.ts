/**
 * @file brick
 */
import {ITransform} from '@chief-editor/base';
import {Vector} from '@co-hooks/vector';
import {IEditorBrickDragInfo} from '../types';

export function getDefaultEditorBrickDragInfo(): IEditorBrickDragInfo {
    return {
        offset: new Vector(),
        sizeOffset: new Vector(),
        transform: getDefaultTransform()
    };
}

export function getDefaultTransform(): ITransform {
    return {
        skewX: 0,
        skewY: 0,
        scaleX: 1,
        scaleY: 1,
        rotate: 0
    };
}
