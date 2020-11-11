/**
 * @file TemplateRender 模板渲染
 */
import {FlowModel, FlowTemplate, IFlowTemplateOptions} from '@chief-editor/flow';
import {UnionOmit} from '@co-hooks/util';
import {RuntimeDispatcher} from '@chief-editor/runtime';
import {useSingleton} from '@rc-hooks/use';
import React, {HTMLAttributes, memo} from 'react';
import {TemplateContext} from '../context/template';

export interface IFlowTemplateRender {
    model: FlowModel;
    template: IFlowTemplateOptions;
    boardId?: string;
    brickId?: string;
}

export type IEditorTemplateRenderProps = UnionOmit<IFlowTemplateRender, HTMLAttributes<HTMLDivElement>>;

export const TemplateRender = memo((props: IEditorTemplateRenderProps): JSX.Element => {

    const {template: {id, board}, model, brickId, boardId, ...extra} = props;

    const template = useSingleton(() => new FlowTemplate(model, {id, board}));

    const node = brickId != null
        ? template.getBrick(brickId).getNode()
        : boardId != null
            ? template.getBoard(boardId).getNode()
            : template.getNode();

    return (
        <TemplateContext.Provider value={template}>
            <div {...extra}>
                <RuntimeDispatcher node={node} />
            </div>
        </TemplateContext.Provider>
    );
});
