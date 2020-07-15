/**
 * @file Form
 */

import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {MemCache} from '@co-hooks/mem-cache';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {getObjectProperty, guid, setObjectProperty} from '@co-hooks/util';
import {IValidateResult} from '@co-hooks/validate';
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

    private processNeedValidateFields(): Array<FormField<unknown>> {

        return this
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
                const {valid, partial} = field.getFieldInfo();

                return !valid || partial;
            });
    }

    private init(): void {
        this.absoluteWatch(this.id, ['*'], () => {
            this.emit('model-change', this.getModel());
        });
    }
}
