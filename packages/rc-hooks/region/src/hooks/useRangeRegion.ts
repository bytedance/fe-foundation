/**
 * @file useSimpleRegion 创建Number上下文
 */

import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';
import {useEffect, useState} from 'react';
import {AxisType, IRangeRegionOptions, RangeRegion} from '@co-hooks/region';

export function useRangeRegion(
    options: IRangeRegionOptions,
    onChange?: (value: number[]) => void
): [RangeRegion, number[]] {

    const region = useSingleton(() => new RangeRegion());
    const onChangeCallback = useRefCallback(onChange);
    const [offset, setOffset] = useState([0, 0]);
    const offsetGetter = useRefGetter(offset);

    useEffect(() => {

        const repaint = (): void => {
            const [start, end] = region.getSelectedOffset();
            const of = offsetGetter();
            const len = region.getAxis(AxisType.HORIZONTAL).getAxisLength();

            if (start.x !== of[0] || len - end.x !== of[1]) {
                setOffset([start.x, len - end.x]);
            }
        };

        repaint();

        region.addListener('repaint', repaint);
        region.addListener('change', onChangeCallback);

        return () => {
            region.removeListener('repaint', repaint);
            region.removeListener('change', onChangeCallback);
        };
    }, []);

    region.updateOptions(options);

    return [region, offset];
}
