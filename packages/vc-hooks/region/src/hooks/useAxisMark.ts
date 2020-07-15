/**
 * @file useMark 获取Mark的信息
 */

import {Ref, onMounted, onUnmounted, ref} from '@vue/composition-api';
import {AxisType} from '@co-hooks/region';
import {useAxis} from './useAxis';

export interface IMarkInfo {
    selected: Ref<boolean>;
    offset: Ref<number>;
    precisionValue: Ref<string>;
    dragging: Ref<boolean>;
}

export function useAxisMark(type: AxisType, value: number): IMarkInfo {

    const axis = useAxis(type);
    const offset = ref(0);
    const selected = ref(false);
    const dragging = ref(false);
    const precisionValue = ref('');

    const update = (): void => {
        precisionValue.value = axis.formatPrecisionValue(value);
        offset.value = axis.getValueOffset(value);
        selected.value = axis.isValueSelected(value);
        dragging.value = axis.getRegion().getDragging();
    };

    // 初始化
    update();

    onMounted(() => axis.addListener('repaint', update));

    onUnmounted(() => axis.removeListener('repaint', update));

    return {
        offset,
        selected,
        dragging,
        precisionValue
    };
}
