/**
 * @file RcScheduleProvider
 */
import React, {ReactNode} from 'react';
import {Schedule} from '@co-hooks/schedule';
import {ScheduleContext} from '../context/schedule';

export interface IRcScheduleProviderProps {
    schedule: Schedule;
    children: ReactNode;
}

export function RcScheduleProvider(props: IRcScheduleProviderProps): JSX.Element {
    const {schedule, children} = props;
    return (
        <ScheduleContext.Provider value={schedule}>
            {children}
        </ScheduleContext.Provider>
    );
}
