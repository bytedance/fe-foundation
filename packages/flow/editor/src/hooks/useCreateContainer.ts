/**
 * @file useCreateContainer
 */
import {Draggable} from '@co-hooks/draggable';
import {IBrickDataGlobal} from '@chief-editor/base';
import {BrickDragType, IBrickDragData} from '@chief-editor/core';
import {useCopySortable} from '@rc-hooks/sortable';
import {RefObject} from 'react';

export function useCreateContainer(
    container: RefObject<HTMLElement> | HTMLElement | null,
    brick: IBrickDataGlobal | IBrickDataGlobal[]
): Draggable<IBrickDragData> {

    return useCopySortable<IBrickDragData>(container, {
        draggable: true,
        data: {
            type: BrickDragType.NEW,
            brickDataList: Array.isArray(brick) ? brick : [brick]
        },
        dragOpacity: 1
    });
}
