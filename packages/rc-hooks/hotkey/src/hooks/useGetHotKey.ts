/**
 * @file useGetHotKey
 */
import {HotKey} from '@co-hooks/hotkey';
import {useContext} from 'react';
import {HotKeyContext} from '../context/hotkey';

export function useGetHotKey(): HotKey {
    const hotkey = useContext(HotKeyContext);

    if (!hotkey) {
        throw new Error('useGetHotKey must be under HotKeyContext');
    }

    return hotkey;
}
