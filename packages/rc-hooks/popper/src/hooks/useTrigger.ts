/**
 * @file useTrigger
 */
import {getElementPosition} from '@co-hooks/dom';
import {useElementPosition} from '@rc-hooks/dom';
import {useUpdate} from '@rc-hooks/use';
import {RefObject, useEffect, useMemo} from 'react';
import {ITriggerOptions, Popper, Trigger, TriggerGroup, TriggerType} from '@co-hooks/popper';
import {useGetPopper} from './useGetPopper';
import {useTriggerGroup} from './useTriggerGroup';

export interface IUseTriggerResult {
    activeShow: boolean;
}

export type IGetTrigger<T, TG> = (
    popper: Popper<T>,
    triggerType: TriggerType,
    triggerId?: string,
    triggerGroup?: TriggerGroup<T>
) => TG;

export function useTrigger<T, TG extends Trigger<T>, W extends ITriggerOptions<T>>(
    getTrigger: IGetTrigger<T, TG>,
    options: W,
    triggerRef: RefObject<HTMLElement>,
    triggerType: TriggerType,
    triggerId?: string
): [TG, IUseTriggerResult, Omit<W, keyof ITriggerOptions<T>>] {

    const popper = useGetPopper<T>();
    const triggerGroup = useTriggerGroup<T>();
    const update = useUpdate();

    const {
        captureOptions = {},
        disabled = false,
        data,
        disableToggleClose,
        ...extra
    } = options;

    const trigger = useMemo<TG>(() => getTrigger(popper, triggerType, triggerId, triggerGroup), []);

    trigger.updateTriggerOptions({disabled, data, disableToggleClose});

    useElementPosition(
        triggerRef,
        () => trigger.isFocus() || trigger.isActiveShow(),
        rect => trigger.updateRect(rect),
        captureOptions
    );

    useEffect(() => {
        trigger.updateReference(triggerRef.current);
    });

    useEffect(() => {

        // show的时候，强制先=刷新一下位置
        const callback = (): void => {

            if (triggerRef.current) {
                trigger.updateRect(getElementPosition(triggerRef.current));
            }

            update();
        };

        trigger.addListener('update-active', callback);

        return () => {
            trigger.removeListener('update-active', callback);
            trigger.dispose();
        };
    }, []);

    const result: IUseTriggerResult = {
        activeShow: trigger.isActiveShow()
    };

    return [trigger, result, extra];
}
