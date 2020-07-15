/**
 * @file RcRangeTimeProvider
 */

import React, {ReactNode} from 'react';
import {RangeTime} from '@co-hooks/date';
import {RangeTimeContext} from '../context/rangeTime';

export interface IRangeTimeProps {
    root: RangeTime;
    children?: ReactNode;
}

export function RcRangeTimeProvider(props: IRangeTimeProps): JSX.Element {
    const {children, root} = props;

    return <RangeTimeContext.Provider value={root}>{children}</RangeTimeContext.Provider>;
}
