/**
 * @file useSimpleRegion 创建Number上下文
 */

import {useRefCallback, useRefGetter, useSingleton} from '@rc-hooks/use';
import {useEffect, useState} from 'react';
import {AxisType, ISimpleRegionOptions, SimpleRegion} from '@co-hooks/region';

export function useSimpleRegion(
    options: ISimpleRegionOptions,
    onChange?: (value: number) => void
): [SimpleRegion, number] {

    const region = useSingleton(() => new SimpleRegion());
    const onChangeCallback = useRefCallback(onChange);
    const [offset, setOffset] = useState(0);
    const offsetGetter = useRefGetter(offset);

    useEffect(() => {

        const repaint = (): void => {
            const end = region.getSelectedOffset()[1];
            const of = offsetGetter();
            const len = region.getAxis(AxisType.HORIZONTAL).getAxisLength();

            if (len - end.x !== of) {
                setOffset(len - end.x);
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
