/**
 * @file index
 */
import {DomNode} from '@co-hooks/dom-node';
import {MemCache} from '@co-hooks/mem-cache';
import {IWatcherFlags} from '@co-hooks/nest-watcher';
import {ValidateTriggerType} from '@co-hooks/validate';
import {FormField, IFormFieldInfo} from '../lib/FormField';
import {FormGroup} from '../lib/FormGroup';
import {FormRepeat} from '../lib/FormRepeat';

export type FormWatchFunc = (changes: string[], flags: IWatcherFlags) => void;

export interface IField {

    id: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isField(): this is FormField<any>;

    isGroup(): this is FormGroup;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isRepeat(): this is FormRepeat<any>;

    reset(): void;

    dispose(): void;
}

export interface IFormField<T> {

    getFieldInfo(): IFormFieldInfo<T>;

    getForm(): IForm;

    reset(): void;

    validate(trigger?: ValidateTriggerType): Promise<void>;

    getValue(): T;

    setValue(value: T): void;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getByExpression(rp: string): any;
}

export interface IForm {

    watch(id: string, scope: FormDomNode, keys: string[], callback: FormWatchFunc, lazy?: boolean): void;

    absoluteWatch(id: string, keys: string[], callback: FormWatchFunc, lazy?: boolean): void;

    unwatch(id: string): void;

    getModel<T extends FormModel>(): T;

    updateModel(model: FormModel): void;

    validate(): Promise<boolean>;

    dispose(): void;

    reset(): void;

    getPathValue<T extends unknown>(path: string): T;

    setPathValue(path: string, value: unknown, isSilent?: boolean): boolean;

    getErrors(includeOriginErrors?: boolean): Array<FormValidateError<unknown>>;

    // getErrorTree(includeOriginErrors?: boolean): FormValidateErrorTree;
}

export enum FormNodeType {
    ROOT = 'root',
    FIELD = 'field',
    GROUP = 'group'
}

export interface FormNode {
    type: FormNodeType;
    field: string;
    id: string;
    repeat?: boolean;
    cache?: MemCache<unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormModel = Record<string, any>;

export type FormDomNode = DomNode<FormNode>;

export type FormValidateErrorType = 'container' | 'field' | 'root';

export interface FormValidateError<T> {
    path: string;
    field: string;
    label: string;
    error: string;
    value: T;
}

export interface FormValidateErrorTree extends Omit<FormValidateError<unknown>, 'value'> {
    type: FormValidateErrorType;
    children: FormValidateErrorTree[];
}
