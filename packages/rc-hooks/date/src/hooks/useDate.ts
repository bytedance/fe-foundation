/**
 * @file useDate 获取日期对象
 */
import {useContext} from 'react';
import {IPanelRoot} from '@co-hooks/date';
import {DateContext} from '../context/date';

export function useDate(): IPanelRoot {

    const date = useContext(DateContext);

    if (date == null) {
        throw new Error('useDate must be use under RcDate');
    }

    return date;
}
