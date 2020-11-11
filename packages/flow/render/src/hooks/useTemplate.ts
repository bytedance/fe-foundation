/**
 * @file useTemplate
 */
import {useContext} from 'react';
import {FlowTemplate} from '@chief-editor/flow';
import {TemplateContext} from '../context/template';

export function useTemplate(): FlowTemplate {

    const template = useContext(TemplateContext);

    if (template == null) {
        throw new Error('useTemplate must be use with `TemplateRender`');
    }

    return template;
}
