/**
 * @file TemplateRender 模板渲染
 */
import {UnionOmit} from '@co-hooks/util';
import {BaseBoard, BaseTemplate} from '@chief-editor/base';
import {RuntimeDispatcher} from '@chief-editor/runtime';
import React, {HTMLAttributes, memo} from 'react';
import {EditableBaseBrickGlobal} from '@chief-editor/core';
import {TemplateContext} from '../context/template';

export interface IPreviewTemplateRender {
    template: BaseTemplate<BaseBoard, EditableBaseBrickGlobal>;
    boardId?: string;
    brickId?: string;
}

export type IEditorTemplateRenderProps = UnionOmit<IPreviewTemplateRender, HTMLAttributes<HTMLDivElement>>;

export const TemplateRender = memo((props: IEditorTemplateRenderProps): JSX.Element => {

    const {template, brickId, boardId, ...extra} = props;

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
