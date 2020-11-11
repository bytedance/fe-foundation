/**
 * @file useMoveContainer
 */
import {Draggable} from '@co-hooks/draggable';
import {BrickDragType, EditorBrickGlobal, IBrickDragData} from '@chief-editor/core';
import {IDynamicDraggableOptions} from '@rc-hooks/draggable';
import {useDynamicSortable} from '@rc-hooks/sortable';
import {RefObject} from 'react';
import {useTemplate} from './useTemplate';

export function useMoveContainer(
    container: RefObject<HTMLElement> | HTMLElement | null,
    brick: EditorBrickGlobal,
    options?: Omit<IDynamicDraggableOptions<IBrickDragData>, 'getContainer' | 'getDragType' | 'draggable' | 'data'>
): Draggable<IBrickDragData> {

    const template = useTemplate();
    const board = brick.getOwnerBoard();

    return useDynamicSortable<IBrickDragData>(container, {
        dragLimit: 2,
        getDragType: e => {
            if (e.altKey && !template.isFunctionalTemplate) {
                return 'copy';
            }
            if (board && board.isLayerBoard()) {
                return 'move-self';
            }
            return 'move';
        },
        draggable: () => (board.isLayerBoard() || brick.isActiveBrick()) && !brick.getLock(),
        data: {
            type: BrickDragType.EXIST,
            templateId: template.id,
            bricks: [brick]
        },
        dragOpacity: 1,
        autoFlow: !board || board.isStreamBoard(),
        ...(options || {})
    });
}
