/**
 * @file AuxiliaryLine
 */
import React from 'react';
import {IAuxiliaryLinePos} from '@chief-editor/core';
import {useEditorCls} from '../../hooks/useEditorCls';

export interface IAuxiliaryLineProps {
    auxiliaryLine: IAuxiliaryLinePos;
}

export function AuxiliaryLine(props: IAuxiliaryLineProps): JSX.Element {
    const {auxiliaryLine: {x, y, xPos, yPos}} = props;
    const lineMaskCls = useEditorCls('template-auxiliary-line-mask');
    const lineCls = useEditorCls('template-auxiliary-line-item');

    return (
        <div className={lineMaskCls}>
            {
                x.map((num: number) => {
                    const [left, right] = xPos[num];

                    return (
                        <div
                            key={`x_${num}`}
                            className={lineCls}
                            style={{
                                position: 'absolute',
                                top: `${num}px`,
                                left: `${left}px`,
                                width: `${right - left}px`,
                                height: '1px'
                            }}
                        />
                    );
                })
            }
            {
                y.map((num: number) => {
                    const [top, bottom] = yPos[num];

                    return (
                        <div
                            key={`y_${num}`}
                            className={lineCls}
                            style={{
                                position: 'absolute',
                                left: `${num}px`,
                                top: `${top}px`,
                                height: `${bottom - top}px`,
                                width: '1px'
                            }}
                        />
                    );
                })
            }
        </div>
    );
}
