/**
 * @file useCreateForm 创建表单
 */
import {Form, FormModel, FormValidateError} from '@co-hooks/form';
import {useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';

export interface ICreateFormOptions {
    form?: Form;
    defaultModel?: FormModel;
    onModelChange: (value: FormModel) => void;
    onValuesChange: (fields: string[]) => void;
    onSubmit: (value: FormModel) => void;
    onSubmitFailed: (errors: Array<FormValidateError<unknown>>) => void;
}

export function useCreateForm(props: ICreateFormOptions): Form {

    const {form, onModelChange, onSubmit, onSubmitFailed, onValuesChange, defaultModel} = props;

    const ins = useSingleton(() => {

        if (form != null) {
            return form;
        }

        return new Form({model: defaultModel});
    });

    useEffect(() => {
        ins.addListener('model-change', onModelChange);
        ins.addListener('values-change', onValuesChange);
        ins.addListener('submit', onSubmit);
        ins.addListener('submit-failed', onSubmitFailed);

        return () => {
            ins.removeListener('model-change', onModelChange);
            ins.removeListener('values-change', onValuesChange);
            ins.removeListener('submit', onSubmit);
            ins.removeListener('submit-failed', onSubmitFailed);
        };
    }, []);

    return ins;
}
