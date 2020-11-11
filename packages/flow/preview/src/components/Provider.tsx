/**
 * @file Provider
 */

import React, {FC, ReactNode, memo} from 'react';
import {IRuntimeBrickPropsGlobal, IRuntimeBrickRenderProps, RuntimeProvider} from '@chief-editor/runtime';
import {BrickRender} from './BrickRender';
import {BoardRender} from './BoardRender';
import {BrickContainerRender} from './BrickContainerRender';

export interface IPreviewProvider {
    children?: ReactNode;
    Bricks: Record<string, FC<IRuntimeBrickPropsGlobal>>;
    BrickRender?: FC<IRuntimeBrickRenderProps>;
}

export const Provider = memo((props: IPreviewProvider): JSX.Element => {

    const {children, BrickRender: PropsBrickRender, Bricks} = props;

    return (
        <RuntimeProvider
            Bricks={Bricks}
            BrickRender={PropsBrickRender || BrickRender}
            BrickContainerRender={BrickContainerRender}
            BoardRender={BoardRender}
        >
            {children}
        </RuntimeProvider>
    );
});
