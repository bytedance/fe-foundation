/**
 * @file usePrecisionValue 输入类组件
 */

import {AxisType} from '@co-hooks/region';
import {Ref, onMounted, onUnmounted, ref} from '@vue/composition-api';
import {usePoint} from './usePoint';

export type INumberConverter = (value: string) => string;

export const DEFAULT_CONVERTER: INumberConverter = val => val;

// part和type不能变化
export function usePrecisionValue(
    part: string,
    type: AxisType,
    format: Ref<INumberConverter>,
    parse: Ref<INumberConverter>
): [Readonly<Ref<string>>, (val: string) => void, () => void] {

    const point = usePoint(part);
    const input = ref(format.value(point.getPrecisionValue(type)));

    const onInput = (val: string): void => {
        input.value = val;
        point.setPrecisionValue(type, parse.value(val), true);
    };

    const onBlur = (): void => {

        const val = parse.value(input.value);

        if (point.getAxis(type).isValidPrecisionValue(val)) {
            point.setPrecisionValue(type, val);
            return;
        }

        input.value = format.value(point.getPrecisionValue(type));
    };

    const update = (): void => {
        input.value = format.value(point.getPrecisionValue(type));
    };

    onMounted(() => point.addListener('repaint', update));

    onUnmounted(() => point.removeListener('repaint', update));

    return [input, onInput, onBlur];
}
