/**
 * @file BrickContainer
 */
import {IRuntimeBrickContainerRenderProps} from '@chief-editor/runtime';
import React, {memo, useRef} from 'react';
import {useRefGetter} from '@rc-hooks/use';
import {useBrickContainer} from '../hooks/useBrickContainer';
import {useTemplate} from '../hooks/useTemplate';

export const BrickContainer = memo((props: IRuntimeBrickContainerRenderProps): JSX.Element => {

    const {children, className, style = {}, node} = props;
    const template = useTemplate();

    const brickGetter = useRefGetter(template.getBrickByNode(node));
    const brick = brickGetter();

    const container = useRef<HTMLDivElement | null>(null);

    useBrickContainer(container, style, brick);

    return (
        <div
            style={style}
            className={className}
            data-brick-id={brick.id}
            ref={container}
        >
            {children}
        </div>
    );
});
