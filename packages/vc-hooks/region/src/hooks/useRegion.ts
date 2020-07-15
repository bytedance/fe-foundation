/**
 * @file useRegion 获取Region Context
 */

import {inject} from '@vue/composition-api';
import {IRegion} from '@co-hooks/region';
import {RegionContext} from '../context/reigon';

export function useRegion(): IRegion {

    const context = inject<IRegion>(RegionContext);

    if (context == null) {
        throw new Error('useRegion must be use with useSimpleRegion');
    }

    return context;
}
