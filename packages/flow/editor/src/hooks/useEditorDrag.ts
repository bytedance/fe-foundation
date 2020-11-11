/**
 * @file useEditorDrag 编辑器拖拽
 */

import {Editor, IBrickDragData, OperationType} from '@chief-editor/core';
import {Vector} from '@co-hooks/vector';
import {Sortable, useCreateSortable} from '@rc-hooks/sortable';
import {useEditorCls} from '../hooks/useEditorCls';

export function useEditorDrag(editor: Editor): Sortable<IBrickDragData> {

    const verticalCls = useEditorCls('placeholder', {vertical: true});
    const horizontalCls = useEditorCls('placeholder', {horizontal: true});
    const containerCls = useEditorCls('placeholder-container');

    return useCreateSortable<IBrickDragData>({
        containerIdentifierPropName: 'data-board-id',
        elemIdentifierPropName: 'data-brick-id',
        hittingContainerClassName: containerCls,
        mode: 'vertical',
        dragLimit: editor.getDragLimit(),
        getDragRoot: () => {

            const bid = editor.getActiveBoardId();

            if (bid != null) {
                return document.getElementById('data-root-' + bid);
            }

            return null;
        },
        isVirtualDrag: () => {

            const board = editor.getActiveBoard();

            if (board == null) {
                return true;
            }

            return board.isLayerBoard();
        },
        getContainerMode: id => {
            const template = editor.getActiveTemplate();

            if (template == null) {
                return null;
            }

            const board = template.getBoard(id);

            if (!board.isStreamBoard()) {
                return null;
            }

            return board.isFloatMode() ? 'horizontal' : 'vertical';
        },
        isValidContainer: (data, id) => {

            const template = editor.getActiveTemplate();

            if (template == null) {
                return false;
            }

            const board = template.getBoard(id);

            return board.isStreamBoard() && board.isValidBoard(data);
        },
        createPlaceHolder: id => {

            const el = document.createElement('div');

            const template = editor.getActiveTemplate();

            if (template == null) {
                return el;
            }

            const board = template.getBoard(id);

            if (!board.isStreamBoard()) {
                return el;
            }

            el.className = board.isFloatMode() ? horizontalCls : verticalCls;

            return el;
        },
        onDragStart: e => {

            editor.enableDragState();

            const board = editor.getActiveBoard();

            if (board != null && board.isLayerBoard() && e.data != null) {
                const template = document.querySelector(`[data-template-id="${board.getOwnerTemplate().id}"]`);
                if (!template) {
                    return;
                }

                board.initDrag(e.data);
            }
        },
        onDragging: e => {

            const board = editor.getActiveBoard();
            const zoom = editor.getZoom() / 100;

            if (board != null && board.isLayerBoard() && e.data != null) {
                board.updateDrag(
                    e.data,
                    new Vector([
                        (e.currentMousePos.clientX - e.startMousePos.clientX) / zoom,
                        (e.currentMousePos.clientY - e.startMousePos.clientY) / zoom
                    ])
                );
            }
        },
        onDragEnd: e => {
            editor.disableDragState();
            const board = editor.getActiveBoard();
            const zoom = editor.getZoom() / 100;

            if (board != null && board.isLayerBoard() && e.data != null) {
                board.finishDrag(
                    e.dragType === 'copy' ? OperationType.CREATE : OperationType.MOVE,
                    e.data,
                    new Vector([
                        (e.currentMousePos.clientX - e.startMousePos.clientX) / zoom,
                        (e.currentMousePos.clientY - e.startMousePos.clientY) / zoom
                    ]),
                    e.currentMousePos
                );
            }
        },
        onDragCancel: () => {

            editor.disableDragState();

            const board = editor.getActiveBoard();

            if (board != null && board.isLayerBoard()) {
                board.cancelDrag();
            }
        },
        onChange: (e, from, to) => {

            editor.disableDragState();

            const template = editor.getActiveTemplate();

            if (template != null && e.data != null) {
                template.getBoard(to.container).applyBoardChange(
                    e.dragType === 'copy' ? OperationType.CREATE : OperationType.MOVE,
                    e.data,
                    to.index
                );
            }
        }
    });
}
