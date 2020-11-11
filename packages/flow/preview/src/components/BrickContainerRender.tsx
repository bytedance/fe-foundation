/**
 * @file BrickContainerRender
 */
import {classnames} from '@co-hooks/util';
import {IRuntimeBrickContainerRenderProps} from '@chief-editor/runtime';
import React, {MouseEvent, useCallback, useEffect, useState} from 'react';
import {PreviewBrickGlobal} from '@chief-editor/core';
import {useTemplate} from '../hooks/useTemplate';

export function BrickContainerRender(props: IRuntimeBrickContainerRenderProps): JSX.Element {
    const {node, children, style = {}, className} = props;
    const template = useTemplate();
    const brick = template.getBrickByNode(node);
    const {status} = brick;
    const [active, setActive] = useState(() => brick.isActiveBrick());
    const isContainer = brick.isContainer();

    useEffect(() => {

        brick.addListener('active-change', setActive);

        return () => {
            brick.removeListener('active-change', setActive);
        };
    }, [brick]);

    const cls = classnames({
        'ce-preview': true,
        ['ce-preview-' + status.toString().toLowerCase()]: true,
        'ce-preview-edit': brick.diffs != null,
        'ce-preview-active': active,
        'ce-preview-container': isContainer
    }, className);

    const onClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        brick.setActive();
    }, [brick]);

    const showPropUpdate = useCallback(() => {
        const template = (brick as PreviewBrickGlobal).getOwnerTemplate();
        template.emit('show-prop-update', template.getActiveBrickDiffInfo());
    }, [brick]);

    return (
        <div className={cls} style={style} onClick={onClick}>
            <span className="ce-preview-tag">
                <span className="tag-info">type={brick.brickType} {brick.label}({brick.field})</span>
                <span className="tag-prop-update" onClick={showPropUpdate}>查看属性更新</span>
            </span>
            {children}
        </div>
    );
}
