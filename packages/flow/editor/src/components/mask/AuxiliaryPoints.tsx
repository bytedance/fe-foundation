/**
 * @file AuxiliaryPoints
 */
import React, {ReactNode} from 'react';
import {Vector} from '@co-hooks/vector';
import {useEditorCls} from '../../hooks/useEditorCls';

export interface IAuxiliaryPointsProps {
    points: Vector[];
}

export function AuxiliaryPoints(props: IAuxiliaryPointsProps): JSX.Element {
    const {points} = props;

    const cls = useEditorCls('template-mask-points');
    const pointCls = useEditorCls('template-mask-point');

    const renderPoint = (point: Vector): ReactNode => {
        const [left, top] = point.get();

        return (
            <div
                key={`${left}_${top}`}
                className={pointCls}
                style={{
                    position: 'absolute',
                    top: `${top}px`,
                    left: `${left}px`,
                    width: 0,
                    height: 0
                }}
            />
        );
    };
    return (
        <div className={cls}>
            {points.map(point => renderPoint(point))}
        </div>
    );
}
