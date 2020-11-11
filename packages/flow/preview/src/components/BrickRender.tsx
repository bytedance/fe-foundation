/**
 * @file BrickRender
 */
import React, {memo} from 'react';
import {IRuntimeBrickRenderProps, useBrickInstance, useRuntime} from '@chief-editor/runtime';
import {useTemplate} from '../hooks/useTemplate';
import {BrickContainerRender} from './BrickContainerRender';

export const BrickRender = memo((props: IRuntimeBrickRenderProps) => {

    const {brickId, brickType, node} = props;
    const {Bricks} = useRuntime();
    const template = useTemplate();
    const brick = template.getBrick(brickId);
    const {layout, ...extra} = useBrickInstance(brick);
    const Brick = Bricks[brickType];

    if (!Brick) {
        console.warn(`Brick: ${brickType} is not found`);
        return null;
    }

    return (
        <BrickContainerRender
            brickId={brickId}
            style={layout}
            node={node}
        >
            <Brick key={brick.id} {...extra} layout={{width: layout.width, height: layout.height}} />
        </BrickContainerRender>
    );
});
