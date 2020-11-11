/**
 * @file useEditor
 */
import {useContext} from 'react';
import {Editor} from '@chief-editor/core';
import {EditorContext} from '../context/editor';

export function useEditor(): Editor {

    const editor = useContext(EditorContext);

    if (!editor) {
        throw new Error('useEditor must be used under EditorProvider');
    }

    return editor;
}
