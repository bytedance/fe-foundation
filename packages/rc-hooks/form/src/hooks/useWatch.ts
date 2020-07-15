/**
 * @file useWatch
 */
import {IWatcherFlags} from '@co-hooks/nest-watcher';
import {guid} from '@co-hooks/util';
import {Form, useFormScope} from '@rc-hooks/form';
import {useRefGetter, useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';
import {useForm} from './useForm';

export type FormWatcherFunc<T> = (form: Form, changes: string[], flags: IWatcherFlags) => void;

// keys变化会直接重新计算
export function useWatch<T>(keys: string[], fn: FormWatcherFunc<T>, lazy: boolean = false): void {

    const form = useForm();
    const scope = useFormScope();
    const id = useSingleton(() => guid());
    const getter = useRefGetter(fn);

    useEffect(() => {

        const callback = (changes: string[], flags: IWatcherFlags): void => {

            const fn = getter();
            fn(form, changes, flags);
        };

        form.watch(id, scope, keys, callback, lazy);

        return () => form.unwatch(id);
    }, keys);
}
