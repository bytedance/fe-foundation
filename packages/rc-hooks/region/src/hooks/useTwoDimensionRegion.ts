/**
 * @file useSimpleRegion 创建Number上下文
 */

import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';
import {useEffect, useState} from 'react';
import {IOffset, getDefaultOffset} from '@co-hooks/dom';
import {AxisType, ITwoDimensionRegionOptions, TwoDimensionRegion} from '@co-hooks/region';

export function useTwoDimensionRegion(
    options: ITwoDimensionRegionOptions,
    onChange?: (value: IOffset) => void
): [TwoDimensionRegion, IOffset] {

    const region = useSingleton(() => new TwoDimensionRegion());
    const onChangeCallback = useRefCallback(onChange);
    const [offset, setOffset] = useState(getDefaultOffset());
    const offsetGetter = useRefGetter(offset);

    useEffect(() => {

        const repaint = (): void => {
            const end = region.getSelectedOffset()[1];
            const of = offsetGetter();
            const xl = region.getAxis(AxisType.HORIZONTAL).getAxisLength();
            const yl = region.getAxis(AxisType.VERTICAL).getAxisLength();

            if (xl - end.x !== of.x || yl - end.y !== of.y) {
                setOffset({
                    x: xl - end.x,
                    y: yl - end.y
                });
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
