/**
 * @file EditorProvider
 */

import React, {ReactNode, memo} from 'react';
import {Editor} from '@chief-editor/core';
import {IRuntimeContext, RuntimeProvider} from '@chief-editor/runtime';
import {RcSortableProvider} from '@rc-hooks/sortable';
import {EditorContext} from '../context/editor';
import {useEditorDrag} from '../hooks/useEditorDrag';
import {BrickRender} from './BrickRender';
import {BoardRender} from './BoardRender';

export interface IEditorProvider extends Omit<IRuntimeContext, 'BrickRender' | 'BoardRender'> {
    className?: string;
    children?: ReactNode;
    editor: Editor;
}

export const EditorProvider = memo((props: IEditorProvider): JSX.Element => {

    const {children, editor, Bricks, BrickContainers, BrickContainerRender} = props;

    const sortable = useEditorDrag(editor);

    return (
        <RcSortableProvider sortable={sortable}>
            <EditorContext.Provider value={editor}>
                <RuntimeProvider
                    Bricks={Bricks}
                    BrickRender={BrickRender}
                    BrickContainers={BrickContainers}
                    BrickContainerRender={BrickContainerRender}
                    BoardRender={BoardRender}
                >
                    {children}
                </RuntimeProvider>
            </EditorContext.Provider>
        </RcSortableProvider>
    );
});
