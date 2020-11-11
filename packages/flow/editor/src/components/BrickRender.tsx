/**
 * @file BrickRender
 */
import React, {memo, useEffect} from 'react';
import {IRuntimeBrickRenderProps, useBrickInstance, useRuntime} from '@chief-editor/runtime';
import {useShallowState} from '@rc-hooks/use';
import {useEditorCls} from '../hooks/useEditorCls';
import {useTemplate} from '../hooks/useTemplate';
import {BrickContainer} from './BrickContainer';

export const BrickRender = memo((props: IRuntimeBrickRenderProps) => {

    const {brickId, brickType, node} = props;
    const {Bricks, BrickContainers = {}, BrickContainerRender} = useRuntime();
    const template = useTemplate();
    const brick = template.getBrickByNode(node);
    const {layout, ...extra} = useBrickInstance(brick);
    const update = (): boolean => brick.isActiveBrick();

    const [active, setActive] = useShallowState(update);

    useEffect(() => {
        const change = (): void => {
            setActive(update);
        };
        template.addListener('active-brick-change', change);

        return () => {
            template.removeListener('active-brick-change', change);
        };
    }, []);

    const cls = useEditorCls('brick-container', {active});

    const Brick = Bricks[brickType];

    if (!Brick) {
        console.warn(`Brick: ${brickType} is not found`);
        return null;
    }

    const Render = BrickContainers[brickType] || BrickContainerRender || BrickContainer;

    return (
        <Render
            brickId={brickId}
            className={cls}
            style={layout}
            node={node}
            key={`container-${brick.id}`}
        >
            <Brick key={brick.id} {...extra} layout={{width: layout.width, height: layout.height}} />
        </Render>
    );
});
