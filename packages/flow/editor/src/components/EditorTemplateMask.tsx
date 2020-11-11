/**
 * @file EditorTemplateMask
 */
import React, {useEffect} from 'react';
import {getKeys} from '@co-hooks/util';
import {useUpdate} from '@rc-hooks/use';
import {RcPortal} from '@rc-hooks/portal';
import {useEditorCls} from '../hooks/useEditorCls';
import {useTemplate} from '../hooks/useTemplate';
import {AuxiliaryLine} from './mask/AuxiliaryLine';
import {BrickRectMask} from './mask/BrickRectMask';
import {GroupRect} from './mask/GroupRect';
import {Equidistance} from './mask/Equidistance';
import {RegionRect} from './mask/RegionRect';

export function EditorTemplateMask(): JSX.Element {
    const template = useTemplate();
    const mask = template.getMask();
    const update = useUpdate();

    const cls = useEditorCls('template-mask');
    const brickMaskCls = useEditorCls('template-brick-mask');
    const templateMaskCls = useEditorCls('template-mask-wrapper');

    useEffect(() => {
        mask.addListener('repaint', update);

        return () => {
            mask.removeListener('repaint', update);
        };
    }, [mask]);

    const activeRect = mask.getActiveBrickRectMap();
    const auxiliaryLine = mask.getAuxiliaryLine();
    const equidistance = mask.getEquidistance();
    // const auxiliaryPoints = mask.getAuxiliaryPoints();
    const groupRect = mask.getGroupRectPos();
    const regionRect = mask.getRegionRect();
    const templatePosition = template.getPosition();
    const board = template.getActiveBoard();
    const boardId = board?.id || '';
    const dragging = board?.isLayerBoard() ? board.isDragging() : false;

    return (
        <RcPortal>
            <div
                className={cls}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 50
                }}
            >
                <div
                    className={templateMaskCls}
                    style={{
                        position: 'absolute',
                        top: `${templatePosition.top}px`,
                        left: `${templatePosition.left}px`,
                        width: `${templatePosition.width}px`,
                        height: `${templatePosition.height}px`
                    }}
                >
                    {
                        !dragging
                        && (
                            <div className={brickMaskCls}>
                                {getKeys(activeRect).map(id => (
                                    <BrickRectMask
                                        key={`brick-mask-${id}`}
                                        boardId={boardId}
                                        data={activeRect[id]}
                                    />
                                ))}
                            </div>
                        )
                    }
                    <AuxiliaryLine auxiliaryLine={auxiliaryLine} />
                    {!!groupRect && <GroupRect info={groupRect} />}
                    <Equidistance data={equidistance} />
                </div>
                <RegionRect data={regionRect} />
            </div>
        </RcPortal>
    );
}
