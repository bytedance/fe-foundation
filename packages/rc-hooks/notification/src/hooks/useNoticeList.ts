/**
 * @file useNoticeList 内置使用，用于获取Notice信息
 */

import {useRefGetter, useUpdate} from '@rc-hooks/use';
import {useContext, useEffect} from 'react';
import {NotificationContext} from '../context/notification';
import {INotice, INoticeBaseProps} from '../lib/NotificationInstance';

export function useNoticeList<T>(placement: string): Array<INotice<T & INoticeBaseProps>> {

    const update = useUpdate();
    const notification = useContext(NotificationContext);
    const placementGetter = useRefGetter(placement);

    if (notification == null) {
        throw new Error('use useNoticeList not in NotificationContext');
    }

    useEffect(() => {

        const callback = (updatedPlacement: string): void => {

            if (updatedPlacement === placementGetter()) {
                update();
            }
        };

        notification.addListener('change', callback);

        return () => {
            notification.removeListener('change', callback);
        };
    }, [notification]);

    return notification.getNotices(placement) as Array<INotice<T & INoticeBaseProps>>;
}
