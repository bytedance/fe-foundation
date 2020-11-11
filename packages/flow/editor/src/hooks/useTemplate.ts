/**
 * @file useTemplate
 */
import {EditorTemplate} from '@chief-editor/core';
import {useContext} from 'react';
import {TemplateContext} from '../context/template';

export function useTemplate(): EditorTemplate {

    const template = useContext(TemplateContext);

    if (template == null) {
        throw new Error('use template must be use with `TemplateRender`');
    }

    return template;
}
