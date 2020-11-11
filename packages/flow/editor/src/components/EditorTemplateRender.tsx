/**
 * @file EditorTemplate 模板渲染
 */
import {IElementPosition} from '@co-hooks/dom';
import {UnionOmit, classnames} from '@co-hooks/util';
import {RuntimeDispatcher} from '@chief-editor/runtime';
import {useElementPosition} from '@rc-hooks/dom';
import React, {HTMLAttributes, memo, useEffect, useRef} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {useEditor} from '../hooks/useEditor';
import {useEditorCls} from '../hooks/useEditorCls';
import {TemplateContext} from '../context/template';

export interface IEditorTemplateRender {
    templateId: string;
}

export type IEditorTemplateRenderProps = UnionOmit<IEditorTemplateRender, HTMLAttributes<HTMLDivElement>>;

export const EditorTemplateRender = memo((props: IEditorTemplateRenderProps): JSX.Element => {

    const {templateId, className, children, ...extra} = props;
    const template = useEditor().getTemplate(templateId);
    const container = useRef<HTMLDivElement | null>(null);
    const update = useUpdate();

    const cls = classnames(className, useEditorCls('template'));
    const rootCls = useEditorCls('template-root');

    const pos = useElementPosition(
        container,
        () => template.isActiveTemplate(),
        (pos: IElementPosition) => {
            template.setPosition(pos);
        },
        {}
    );

    template.setPosition(pos);

    useEffect(() => {
        template.addListener('active-change', update);

        return () => {
            template.removeListener('active-change', update);
        };
    }, []);

    return (
        <TemplateContext.Provider value={template}>
            <div
                {...extra}
                className={cls}
                data-template-id={templateId}
                ref={container}
            >
                <RuntimeDispatcher
                    node={template.getNode()}
                    className={rootCls}
                    style={{width: '100%', height: '100%'}}
                />
            </div>
            {children}
        </TemplateContext.Provider>
    );
});
