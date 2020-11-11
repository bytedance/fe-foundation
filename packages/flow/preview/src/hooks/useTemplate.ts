/**
 * @file useTemplate
 */
import {BaseBoard, BaseTemplate} from '@chief-editor/base';
import {useContext} from 'react';
import {EditableBaseBrickGlobal} from '@chief-editor/core';
import {TemplateContext} from '../context/template';

export function useTemplate(): BaseTemplate<BaseBoard, EditableBaseBrickGlobal> {

    const template = useContext(TemplateContext);

    if (template == null) {
        throw new Error('useTemplate must be use with `TemplateRender`');
    }

    return template;
}
