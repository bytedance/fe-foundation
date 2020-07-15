/**
 * @file useWatch
 */
import {guid} from '@co-hooks/util';
import {processRelativeKey, useFormScope} from '@rc-hooks/form';
import {useSingleton} from '@rc-hooks/use';
import {useEffect, useState} from 'react';
import {useForm} from './useForm';

// keys变化会直接重新计算
export function useWatchField<T>(key: string, lazy: boolean = false): T {

    const form = useForm();
    const scope = useFormScope();
    const id = useSingleton(() => guid());
    const [state, setState] = useState(() => form.getPathValue(processRelativeKey(scope, key)));

    useEffect(() => {

        const callback = (): void => {
            setState(form.getPathValue(processRelativeKey(scope, key)));
        };

        form.watch(id, scope, [key], callback, lazy);

        return () => form.unwatch(id);
    }, [key]);

    return state as T;
}
