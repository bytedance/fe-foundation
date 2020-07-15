/**
 * @file useFormGroup
 */

import {useReactiveState} from '@rc-hooks/use';
import {FormGroup, IFormGroupInfo, IFormGroupOptions} from '@co-hooks/form';
import {useForm} from './useForm';
import {useFormScope} from './useFormScope';

export function useFormGroup(options: IFormGroupOptions): IFormGroupInfo & {instance: FormGroup} {

    const form = useForm();
    const scope = useFormScope();

    const [instance, state] = useReactiveState(
        () => new FormGroup(form, scope, options),
        options,
        ins => ins.getGroupInfo()
    );

    return {
        ...state,
        instance
    };
}
