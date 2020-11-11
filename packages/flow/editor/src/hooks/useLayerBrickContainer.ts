/**
 * @file useLayerBrickContainer
 */

import {EditorBrickGlobal} from '@chief-editor/core';
import {RefObject, useEffect} from 'react';
import {NodeType} from '@chief-editor/base';
import {useContainer} from '@rc-hooks/dom';
import {useRefGetter} from '@rc-hooks/use';
import {useEditor} from './useEditor';

export function useLayerBrickContainer(
    container: RefObject<HTMLElement>,
    brick: EditorBrickGlobal
): void {
    const containerGetter = useContainer(container);
    const brickGetter = useRefGetter(brick);
    const editor = useEditor();

    // 层式布局实现直接拖拽选中，因为co-drag会阻止冒泡，影响react 事件执行，所以手动绑定dom事件
    useEffect(() => {
        const elem = containerGetter();

        if (!elem) {
            return;
        }

        const parentNode = brick.getNode().parentNode;
        const boardType = parentNode?.getValue()?.type ?? NodeType.STREAM;

        if (boardType !== NodeType.LAYER) {
            return;
        }

        const onMouseDown = (e: MouseEvent): void => {
            const brick = brickGetter();
            const activeBoardId = editor.getActiveBoardId();
            const template = editor.getActiveTemplate();

            if (!template) {
                return;
            }

            const boardIds = brickGetter().getAncestorBoardIds();

            const index = boardIds.indexOf(activeBoardId);

            // activeBoard就是当前元素所在的board
            if (index === boardIds.length - 1) {
                brick.setActive(e.shiftKey);
                return;
            }

            // 当前元素不在activeBoard内，视为取消选中
            if (index === -1) {
                template.setActiveBoardId(boardIds[boardIds.length - 1] || 'root', true);
                brick.setActive();
                return;
            }

            const nextBoard = boardIds[index + 1];
            const board = template.getBoard(nextBoard);

            const targetBrickNode = board.getNode().parentNode;

            if (!targetBrickNode) {
                return;
            }

            const targetBrick = template.getBrickByNode(targetBrickNode);

            targetBrick.setActive(e.shiftKey);
        };

        const onDbClick = (e: MouseEvent): void => {
            const template = editor.getActiveTemplate();
            const currentBrick = brickGetter();

            if (!template) {
                return;
            }

            if (currentBrick.isActiveBrick()) {
                return;
            }

            const ancestorBrickIds = brickGetter().getAncestorBrickIds();

            ancestorBrickIds.some((brickId: string, i: number) => {
                const brick = template.getBrick(brickId);
                const active = brick.isActiveBrick();

                if (active) {
                    const nextBrickId = ancestorBrickIds[i + 1];
                    let targetBrick = currentBrick;

                    // 是自己的祖先元素
                    if (nextBrickId) {
                        targetBrick = template.getBrick(nextBrickId);
                    }

                    template.setActiveBoardId(targetBrick.getOwnerBoard().id, true);
                    targetBrick.setActive();
                }

                return active;
            });
        };

        elem.addEventListener('mousedown', onMouseDown);
        elem.addEventListener('dblclick', onDbClick);

        return () => {
            elem.removeEventListener('mousedown', onMouseDown);
            elem.removeEventListener('dblclick', onDbClick);
        };
    }, []);

}
