/**
 * @file useFormRepeat 重复组件
 */
import {useReactiveState} from '@rc-hooks/use';
import {FormRepeat, IFormRepeatInfo, IFormRepeatOptions} from '@co-hooks/form';
import {useCallback} from 'react';
import {useForm} from './useForm';
import {useFormScope} from './useFormScope';

export interface IFormRepeatExtra<T> {
    instance: FormRepeat<T>;
    onSort: (fromKey: string, toKey: string) => void;
    onAppend: (data?: T) => void;
    onInsert: (key: string, data?: T) => void;
    onRemove: (key: string) => void;
}

export function useFormRepeat<T>(options: IFormRepeatOptions<T>): IFormRepeatInfo<T> & IFormRepeatExtra<T> {

    const form = useForm();
    const scope = useFormScope();

    const [instance, state] = useReactiveState(
        () => new FormRepeat(form, scope, options),
        options,
        ins => ins.getRepeatInfo()
    );

    const onAppend = useCallback((data?: T) => instance.appendRepeatItem(data), []);
    const onInsert = useCallback((key: string, data?: T) => instance.insertRepeatItem(key, data), []);
    const onSort = useCallback((fromKey: string, toKey: string) => instance.sortRepeatItem(fromKey, toKey), []);
    const onRemove = useCallback((key: string) => instance.removeRepeatItem(key), []);

    return {
        ...state,
        instance,
        onAppend,
        onSort,
        onInsert,
        onRemove
    };
}
