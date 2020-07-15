/**
 * @file useSimpleRegion 创建Number上下文
 */

import {onMounted, onUnmounted, provide} from '@vue/composition-api';
import {SimpleRegion} from '@co-hooks/region';
import {RegionContext} from '../context/reigon';

export function useSimpleRegion(onChange: (value: number) => void): SimpleRegion {

    const region = new SimpleRegion();

    onMounted(() => region.addListener('change', onChange));

    onUnmounted(() => region.removeListener('change', onChange));

    provide(RegionContext, region);

    return region;
}
