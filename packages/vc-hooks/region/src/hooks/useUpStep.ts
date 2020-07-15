/**
 * @file useUpStep 上一步
 */

import {AxisType} from '@co-hooks/region';
import {Ref, onMounted, onUnmounted, ref} from '@vue/composition-api';
import {usePoint} from './usePoint';

export function useUpStep(part: string, type: AxisType): [Readonly<Ref<boolean>>, (stepCount?: number) => void] {

    const point = usePoint(part);
    const disabled = ref(false);

    const update = (): void => {
        const value = point.getPrecisionValue(type);
        const {step, max} = point.getAxis(type).getAxisConfig();

        disabled.value = +value + step > max;
    };

    onMounted(() => point.addListener('repaint', update));

    onUnmounted(() => point.removeListener('repaint', update));

    const handler = (stepCount?: number): void => point.upStep(type, stepCount);

    return [disabled, handler];
}
