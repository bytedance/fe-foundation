/**
 * @file Provider
 */

import React, {FC, ReactNode, memo} from 'react';
import {IRuntimeBrickPropsGlobal, RuntimeProvider} from '@chief-editor/runtime';
import {BrickRender} from './BrickRender';
import {BoardRender} from './BoardRender';
import {BrickContainerRender} from './BrickContainerRender';

export interface IFlowProvider {
    children?: ReactNode;
    Bricks: Record<string, FC<IRuntimeBrickPropsGlobal>>;
}

export const Provider = memo((props: IFlowProvider): JSX.Element => {

    const {children, Bricks} = props;

    return (
        <RuntimeProvider
            Bricks={Bricks}
            BrickRender={BrickRender}
            BrickContainerRender={BrickContainerRender}
            BoardRender={BoardRender}
        >
            {children}
        </RuntimeProvider>
    );
});
