/**
 * @file Form
 */

import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {MemCache} from '@co-hooks/mem-cache';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {getObjectProperty, guid, setObjectProperty} from '@co-hooks/util';
import {IValidateResult, ValidateTriggerType} from '@co-hooks/validate';
import {
    FormDomNode,
    FormModel,
    FormNode,
    FormNodeType,
    FormValidateError,
    // FormValidateErrorTree,
    FormWatchFunc,
    IField,
    IForm
} from '../types';
import {processNestWatcherKey, processRelativeKey, wrapFunction} from '../util';
import {FormField} from './FormField';

export interface IFormOptions {
    model?: FormModel;
}

export interface IFormEvent {
    'submit': [FormModel];
    'submit-failed': [Array<FormValidateError<unknown>>];
    'validate-change': [];
    'model-change': [FormModel];
    'values-change': [string[]]
}


export class Form extends Emitter<IFormEvent> implements IForm {

    private readonly id: string;

    private readonly watcher: NestWatcher;

    private readonly root: FormDomNode;

    private model: FormModel;

    private readonly map: Record<string, IField> = {};

    constructor(options: IFormOptions) {

        super();

        const {model = {}} = options;
        this.id = guid();
        this.watcher = new NestWatcher();
        this.root = new DomNode<FormNode>({
            type: FormNodeType.ROOT,
            field: '',
            id: '',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cache: new MemCache<any>()
        });
        this.model = model;
        this.init();
    }

    public getRootNode(): FormDomNode {
        return this.root;
    }

    public getField(id: string): IField {
        return this.map[id];
    }

    // path 可能是 'repeat.*'
    public getFieldsByPath(path: string): FormField<unknown>[] {
        const fields = this
        .root
        .getSubNodes(node => {

            const {type} = node.getValue();

            if (type !== FormNodeType.FIELD) {
                return null;
            }

            return true;
        })
        .map(node => {
            const {id} = node.getValue();

            return this.map[id] as FormField<unknown>;
        })
        .filter(field => {
            // keyIsMatch('repeat.*', repeat.0) === true
            return NestWatcher.keyIsMatch(path, field.getPath());
        });

        if (!fields.length) {
            console.warn(`path为${path}的field不存在`);
        }

        return fields;
    }

    public register(field: IField): void {
        this.map[field.id] = field;
    }

    public unregister(field: IField): void {
        delete this.map[field.id];
    }

    public dispose(): void {
        Object.keys(this.map).forEach(key => this.map[key].dispose());
    }

    public disposeNode(node: FormDomNode): void {
        const {id} = node.getValue();
        this.map[id].dispose();
    }

    // region watch
    public watch(
        id: string,
        scope: FormDomNode | null,
        paths: string[],
        callback: FormWatchFunc,
        lazy: boolean = false
    ): void {

        const valueKeys = paths.map(path => processRelativeKey(scope || this.root, path));
        const watchKeys = paths.map(path => processNestWatcherKey(scope || this.root, path));
        let values = valueKeys.map(key => this.getPathValue(key));

        this.absoluteWatch(
            id,
            watchKeys,
            wrapFunction((changes, flags) => {
                const old = values;
                values = valueKeys.map(key => this.getPathValue(key));
                const updated = valueKeys.some(
                    (key, idx) => old[idx] !== values[idx]
                );

                if (updated) {
                    callback(changes, flags);
                }
            }),
            lazy
        );
    }

    public absoluteWatch(id: string, paths: string[], callback: FormWatchFunc, lazy: boolean = false): void {
        this.watcher.register(id, paths.map(item => 'model.' + item), wrapFunction(callback), lazy);
    }

    public unwatch(id: string): void {
        this.watcher.unregister(id);
    }

    // endregion watch

    // region model
    public getModel<T extends FormModel>(): T {
        return this.model as T;
    }

    public getPathValue<T extends unknown>(path: string): T {
        return getObjectProperty(this.model, NestWatcher.splitKey(path)) as T;
    }

    public setPathValue(path: string, value: unknown, isSilent: boolean = false): boolean {

        const res = setObjectProperty(this.model, value, NestWatcher.splitKey(path));

        if (!isSilent) {
            this.watcher.notify(['model.' + path], {
                manual: true
            });
        }

        return res;
    }

    public updateModel(model: FormModel): void {
        this.model = model;
        this.watcher.notify(['model']);
    }

    public submit(): void {
        this
            .validate()
            .then(success => {

                if (success) {
                    this.emit('submit', this.model);
                    return;
                }

                this.emit('submit-failed', this.getErrors());

            })
            .catch(() => console.log('this will not reached'));
    }

    // endregion model

    // region validate
    public validate(): Promise<boolean> {

        const fields = this.processNeedValidateFields();

        return Promise
            .all(fields.map(field => field.validate('force')))
            .then(() => {

                const fields = this.processNeedValidateFields();

                if (fields.length > 0) {
                    // 触发首个错误元素的定位
                    fields[0].emit('focus');
                    return false;
                }

                return true;
            });
    }

    // validateField: 可以指定triggerType，默认触发全部
    public validateField(path: string, trigger: ValidateTriggerType = 'manual'): Promise<boolean> {
        const fields = this.getFieldsByPath(path);
        return Promise.all(fields.map(field => field.validate(trigger)))
            .then(() => {
                const needValdateFields = this.processNeedValidateFields(fields);
                return !needValdateFields.length;
            });
    }

    // validateFields: 触发全部校验
    public validateFields(paths: string[]): Promise<boolean> {
        return Promise.all(paths.map(path => this.validateField(path)))
            .then(res => res.every(field => field));
    }

    // getFieldErrors: 获取错误信息
    public getFieldsErrors(paths: string[]): Array<FormValidateError<unknown>> {
        const fields = paths.reduce(
            (sum, path) => sum.concat(this.getFieldsByPath(path))
        , [] as FormField<unknown>[]);

        return this.processNeedValidateFields(fields).map(item => item.getValidateError());
    }

    public reset(): void {
        Object.keys(this.map).forEach(key => this.map[key].reset());
    }

    public getErrors(): Array<FormValidateError<unknown>> {
        return this
            .processNeedValidateFields()
            .map(item => item.getValidateError());
    }

    //
    // public getErrorTree(includeOriginErrors: boolean = false): FormValidateErrorTree {
    //     return {} as FormValidateErrorTree;
    // }

    public dispatchValidateResult(key: string, node: FormDomNode, result: IValidateResult): void {

        let scope = node.parentNode;

        while (scope != null) {

            const {id, type} = scope.getValue();

            if (type === FormNodeType.GROUP) {

                const field = this.map[id];

                if (field && field.isGroup()) {
                    field.processValidateResult(id, result);
                }
            }

            scope = scope.parentNode;
        }
    }

    // endregion validate
    // 有needFields则过滤它，没有则过滤所有field
    private processNeedValidateFields(needFields?: FormField<unknown>[]): Array<FormField<unknown>> {
        let fields = needFields;
        if (!fields) {
            fields = this.root.getSubNodes(node => {
                const {type} = node.getValue();

                if (type !== FormNodeType.FIELD) {
                    return null;
                }

                return true;
            })
            .map(node => {
                const {id} = node.getValue();

                return this.map[id] as FormField<unknown>;
            });
        }

        return fields.filter(field => {
            const {valid, partial} = field.getFieldInfo();

            return !valid || partial;
        });
    }

    private init(): void {
        this.absoluteWatch(this.id, ['*'], (changes: string[]) => {
            this.emit('model-change', this.getModel());
            this.emit('values-change', changes.map(fieldPath => fieldPath.replace(/^model\./, '')));
        });
    }
}
