/**
 * @file useFormRepeatItem Repeat子项目
 */

import {FormGroup, IFormGroupInfo, IFormGroupOptions} from '@co-hooks/form';
import {useReactiveState} from '@rc-hooks/use';
import {useCallback} from 'react';
import {useForm} from './useForm';
import {useFormScope} from './useFormScope';

export interface IFormRepeatItemInfo<T> extends IFormGroupInfo {
    instance: FormGroup;
    onRemove: () => void;
    onAppend: (data?: T) => void;
    onPrepend: (data?: T) => void;
}

export interface IRepeatItemOptions extends IFormGroupOptions {
    field: string;
}

export function useFormRepeatItem<T>(options: IRepeatItemOptions): IFormRepeatItemInfo<T> {

    const form = useForm();
    const scope = useFormScope();
    const {field} = options;

    const repeat = form.getField(scope.getValue().id);

    if (!repeat.isRepeat()) {
        throw new Error('RepeatItem must use under Repeat');
    }

    const [instance, state] = useReactiveState(
        () => repeat.getRepeatGroup(field),
        options,
        ins => ins.getGroupInfo()
    );

    const onRemove = useCallback(() => repeat.removeRepeatItem(field), []);
    const onAppend = useCallback((data?: T) => repeat.insertAfterRepeatItem(field, data), []);
    const onPrepend = useCallback((data?: T) => repeat.insertBeforeRepeatItem(field, data), []);

    return {
        instance,
        onRemove,
        onAppend,
        onPrepend,
        ...state
    };
}
