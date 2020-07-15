/**
 * @file RcTimeProvider
 */

import React, {ReactNode} from 'react';
import {Time} from '@co-hooks/date';
import {TimeContext} from '../context/time';

export interface ITimeProps {
    root: Time;
    children?: ReactNode;
}

export function RcTimeProvider(props: ITimeProps): JSX.Element {
    const {children, root} = props;

    return <TimeContext.Provider value={root}>{children}</TimeContext.Provider>;
}
