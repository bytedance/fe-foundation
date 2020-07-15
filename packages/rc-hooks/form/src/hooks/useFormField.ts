/**
 * @file useFormField
 */
import {FormField, IFormFieldInfo, IFormFieldOptions} from '@co-hooks/form';
import {useReactiveState} from '@rc-hooks/use';
import {FocusEvent, Ref, useCallback, useEffect, useRef} from 'react';
import {useForm} from './useForm';
import {useFormScope} from './useFormScope';

export interface IFormFieldBase<T, K extends HTMLTextAreaElement | HTMLInputElement = HTMLInputElement> {

    value?: T;

    domRef?: Ref<HTMLElement>;

    inputRef?: Ref<K>;

    onBlur?: (e: FocusEvent<K>) => void;

    onValueChange?: (value: T) => void;
}

export interface IFormFieldExtra<T, K extends HTMLTextAreaElement | HTMLInputElement = HTMLInputElement>
    extends Required<IFormFieldBase<T, K>> {

    instance: FormField<T>;

    validate: () => Promise<void>;
}

export function useFormField<T, K extends HTMLTextAreaElement | HTMLInputElement = HTMLInputElement>(
    options: IFormFieldOptions<T>
): IFormFieldInfo<T> & IFormFieldExtra<T, K> {

    const form = useForm();
    const scope = useFormScope();

    const [instance, state] = useReactiveState(
        () => new FormField<T>(form, scope, options),
        options,
        ins => ins.getFieldInfo()
    );

    const onValueChange = useCallback((value: T) => instance.setValue(value), []);
    const onBlur = useCallback(() => instance.validate('blur'), []);
    const validate = useCallback(() => instance.validate('manual'), []);
    const domRef = useRef<HTMLElement>(null);
    const inputRef = useRef<K>(null);

    useEffect(() => {

        const callback = (): void => {

            const preventScroll = domRef.current != null;

            if (inputRef.current != null) {
                inputRef.current.focus({preventScroll});
            }

            // stopScroll();

            if (domRef.current) {
                // todo
                domRef.current.scrollIntoView({block: 'center', behavior: 'smooth'});
                // startScroll();
            }
        };

        instance.addListener('focus', callback);

        return () => instance.removeListener('focus', callback);
    }, []);

    return {
        ...state,
        instance,
        onValueChange,
        onBlur,
        validate,
        domRef,
        inputRef
    };
}
