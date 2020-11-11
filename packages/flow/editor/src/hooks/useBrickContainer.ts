/**
 * @file useBrickContainer
 */
import {EditorBrickGlobal, IBrickDragData} from '@chief-editor/core';
import {guid} from '@co-hooks/util';
import {useContainer} from '@rc-hooks/dom';
import {IDynamicDraggableOptions} from '@rc-hooks/draggable';
import {useRefGetter} from '@rc-hooks/use';
import {CSSProperties, RefObject, useEffect, useRef} from 'react';
import {useLayerBrickContainer} from './useLayerBrickContainer';
import {useMoveContainer} from './useMoveContainer';

export type useBrickContainerOptions =
    Omit<IDynamicDraggableOptions<IBrickDragData>, 'getContainer' | 'getDragType' | 'data' | 'onDragEnd'>;

export function useBrickContainer(
    container: RefObject<HTMLElement>,
    style: CSSProperties,
    brick: EditorBrickGlobal,
    options?: useBrickContainerOptions
): void {
    const status = useRef(guid());
    const containerGetter = useContainer(container);
    const brickGetter = useRefGetter(brick);

    useMoveContainer(container, brick, {
        onDragEnd: () => {
            status.current = guid();
        },
        ...(options || {})
    });

    useEffect(() => {
        const target = container.current;

        if (target) {
            Object.assign(target.style, style);
        }
    }, [status.current]);

    useLayerBrickContainer(container, brick);

    // 点击事件绑定
    useEffect(() => {
        const elem = containerGetter();

        if (!elem) {
            return;
        }

        const onClick = (e: MouseEvent): void => {
            const brick = brickGetter();
            brick.setActive(e.shiftKey || e.ctrlKey);
        };

        elem.addEventListener('click', onClick);

        return () => elem.removeEventListener('click', onClick);

    }, []);

}
