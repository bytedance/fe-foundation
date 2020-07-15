/**
 * @file useGuid 获取一个全局唯一的Guid
 */
import {useMemo} from 'react';
import {guid} from '@co-hooks/util';

export function useGuid(): string {
    return useMemo(() => guid(), []);
}
