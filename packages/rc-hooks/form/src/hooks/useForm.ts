/**
 * @file useForm
 */

import {Form} from '@co-hooks/form';
import {useContext} from 'react';
import {FormContext} from '../context/form';

export function useForm(): Form {

    const form = useContext(FormContext);

    if (form == null) {
        throw new Error('useForm must be use with FormProvider');
    }

    return form;
}
