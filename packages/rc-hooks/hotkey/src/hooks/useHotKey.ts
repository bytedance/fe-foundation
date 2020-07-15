/**
 * @file useHotKey
 */
import {useEffect} from 'react';
import {useRefCallback} from '@rc-hooks/use';
import {CallbackFun, HotKeyEventType} from '@co-hooks/hotkey';
import {useGetHotKey} from './useGetHotKey';

export function useHotKey(
    hotKeyList: string,
    callback: CallbackFun,
    eventType: HotKeyEventType
): void {
    const cb = useRefCallback(callback);
    const hotkey = useGetHotKey();
    useEffect(() => {
        const hotKeys = hotKeyList.split(',');
        hotkey.addHotKeys(hotKeys, cb, eventType);

        return () => {
            hotkey.removeHotKeys(hotKeys, cb, eventType);
        };
    }, [hotKeyList, eventType]);
}
