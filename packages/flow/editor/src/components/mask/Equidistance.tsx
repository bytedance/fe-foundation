/**
 * @file Equidistance
 */
import {IEquidistanceLine, IEquidistanceLineItem} from '@chief-editor/core';
import React, {CSSProperties, ReactNode} from 'react';
import {useEditorCls} from '../../hooks/useEditorCls';

export interface IEquidistanceProps {
    data: IEquidistanceLine;
}

export function Equidistance(props: IEquidistanceProps): JSX.Element {
    const {data: {x, y}} = props;
    const cls = useEditorCls('template-equidistance');
    const xCls = useEditorCls('template-equidistance-x');
    const yCls = useEditorCls('template-equidistance-y');

    const renderX = (): ReactNode => x.map((item: IEquidistanceLineItem) => {
        const {vPos, start, end} = item;

        const style: CSSProperties = {
            position: 'absolute',
            top: `${vPos}px`,
            left: `${start}px`,
            width: `${end - start}px`,
            height: '1px'
        };

        return (<div className={xCls} key={`x_${vPos}_${start}_${end}`} style={style} />);
    });

    const renderY = (): ReactNode => y.map((item: IEquidistanceLineItem) => {
        const {vPos, start, end} = item;

        const style: CSSProperties = {
            position: 'absolute',
            left: `${vPos}px`,
            top: `${start}px`,
            height: `${end - start}px`,
            width: '1px'
        };

        return (<div className={yCls} key={`y_${vPos}_${start}_${end}`} style={style} />);
    });

    return (
        <div className={cls}>
            {renderX()}
            {renderY()}
        </div>
    );
}
