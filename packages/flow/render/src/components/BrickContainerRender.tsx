/**
 * @file BrickContainerRender
 */
import {classnames} from '@co-hooks/util';
import {IRuntimeBrickContainerRenderProps} from '@chief-editor/runtime';
import React from 'react';

export function BrickContainerRender(props: IRuntimeBrickContainerRenderProps): JSX.Element {

    const {children, style = {}, className} = props;
    const cls = classnames('ce-flow', className);

    return (
        <div className={cls} style={style}>
            {children}
        </div>
    );
}
