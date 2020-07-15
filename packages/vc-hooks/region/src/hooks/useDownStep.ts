/**
 * @file useDownStep 下一步
 */

import {AxisType} from '@co-hooks/region';
import {Ref, onMounted, onUnmounted, ref} from '@vue/composition-api';
import {usePoint} from './usePoint';

export function useDownStep(part: string, type: AxisType): [Readonly<Ref<boolean>>, (stepCount?: number) => void] {

    const point = usePoint(part);
    const disabled = ref(false);

    const update = (): void => {
        const value = point.getPrecisionValue(type);
        const {step, min} = point.getAxis(type).getAxisConfig();

        disabled.value = +value - step < min;
    };

    onMounted(() => point.addListener('repaint', update));

    onUnmounted(() => point.removeListener('repaint', update));

    const handler = (stepCount?: number): void => point.downStep(type, stepCount);

    return [disabled, handler];
}
