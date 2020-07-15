/**
 * @file useRegion 获取Region Context
 */

import {useContext} from 'react';
import {IRegion} from '@co-hooks/region';
import {RegionContext} from '../context/reigon';

export function useRegion(): IRegion {

    const context = useContext<IRegion | null>(RegionContext);

    if (context == null) {
        throw new Error('useRegion must be use under RcRegionProvider');
    }

    return context;
}
