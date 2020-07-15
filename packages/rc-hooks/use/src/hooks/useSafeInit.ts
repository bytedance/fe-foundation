/**
 * @file useSafeInit
 */
import {useSingleton, useWillUnmount} from '@rc-hooks/use';

export function useSafeInit(creator: () => VoidFunction): void {
    const unbind = useSingleton(creator);
    useWillUnmount(unbind);
}
