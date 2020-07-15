/**
 * @file Field
 */
import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {MemCache} from '@co-hooks/mem-cache';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {guid} from '@co-hooks/util';
import {
    IValidateResult,
    IValidateRule,
    ValidateTriggerType,
    Validator
} from '@co-hooks/validate';
import {getNestCachePath, getNestWatchPath, getRelativeKeys} from '../util';
import {FormDomNode, FormNode, FormNodeType, FormValidateError, IField, IFormField} from '../types';
import {Form} from './Form';
import {FormGroup} from './FormGroup';
import {FormRepeat} from './FormRepeat';

export interface IFormFieldEvent {
    repaint: [];
    focus: [];
}

export interface IFormFieldOptions<T> {
    field: string;
    label?: string;
    initialValue: T;
    defaultValue?: T;
    rules?: IFormValidateRule | IFormValidateRule[];
}

export interface IFormFieldInfo<T> extends IValidateResult {
    value: T;
    manual: boolean;
    field: string;
    label: string;
    path: string;
}

export type IFormValidateRule = IValidateRule<IFormField<unknown>>;

export class FormField<T> extends Emitter<IFormFieldEvent> implements IField, IFormField<T> {

    public readonly id: string = guid();

    public readonly field: string;

    public label: string;

    private readonly node: FormDomNode;

    private value: T;

    private readonly initialValue: T;

    private defaultValue?: T;

    private readonly validator: Validator<IFormField<unknown>> = new Validator<IFormField<unknown>>(this);

    private readonly form: Form;

    constructor(form: Form, scope: FormDomNode, options: IFormFieldOptions<T>) {
        super();
        const {defaultValue, field, label, initialValue} = options;
        this.form = form;
        this.node = new DomNode<FormNode>({type: FormNodeType.FIELD, field, id: this.id}, scope);
        this.field = field;

        const cacheValue = this.getCacheValue();

        this.label = label || field;
        this.initialValue = initialValue;
        this.defaultValue = defaultValue;
        this.value = cacheValue != null ? cacheValue : defaultValue == null ? initialValue : defaultValue;
        this.init();
    }

    public updateOptions(options: IFormFieldOptions<T>): void {

        const {field, label, rules, defaultValue} = options;

        if (field !== this.field) {
            throw new Error('field should not be updated');
        }

        this.label = label || field;
        this.defaultValue = defaultValue;
        this.validator.updateRules(Array.isArray(rules) ? rules : rules != null ? [rules] : []);
    }

    public isField(): this is FormField<T> {
        return true;
    }

    public isGroup(): this is FormGroup {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public isRepeat(): this is FormRepeat<any> {
        return false;
    }

    public getFieldInfo(): IFormFieldInfo<T> {
        return {
            field: this.field,
            value: this.value,
            label: this.label,
            path: this.getPath(),
            ...this.validator.getValidateInfo()
        };
    }

    public getValidateError(): FormValidateError<T> {

        return {
            label: this.label,
            field: this.field,
            error: this.validator.getValidateInfo().msg,
            value: this.value,
            path: this.getPath()
        };
    }

    public reset(): void {
        this.validator.reset();
        this.form.setPathValue(
            NestWatcher.combineKeys(getRelativeKeys(this.node)),
            this.defaultValue == null ? this.initialValue : this.defaultValue
        );
    }

    public validate(trigger: ValidateTriggerType = 'manual'): Promise<void> {
        this.validator.updateValue(this.value);
        return this.validator.validate(trigger);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getByExpression(rp: string): any {

        if (!/^\./.test(rp)) {
            return this.form.getPathValue(rp);
        }

        const path = NestWatcher.splitKey(this.getPath());

        path.pop();

        while (/^(\.\.\/)/.test(rp)) {
            rp = rp.slice(RegExp.$1.length);
            path.pop();
        }

        if (/^(\.\/)/.test(rp)) {
            rp = rp.slice(RegExp.$1.length);
        }

        return this.form.getPathValue(NestWatcher.combineKeys([...path, ...NestWatcher.splitKey(rp)]));
    }

    public dispose(): void {
        this.form.unregister(this);
        this.form.unwatch(this.id);
        this.validator.dispose();
        this.setCacheValue();
        this.node.remove();
    }

    public getValue(): T {
        return this.value;
    }

    public setValue(value: T): void {
        this.form.setPathValue(NestWatcher.combineKeys(getRelativeKeys(this.node)), value);
        this.validator.updateValue(value, true);
    }

    public getForm(): Form {
        return this.form;
    }

    public getNode(): FormDomNode {
        return this.node;
    }

    public getPath(): string {
        return NestWatcher.combineKeys(getRelativeKeys(this.node));
    }

    private init(): void {

        this.form.register(this);
        const value: T = this.form.getPathValue(this.getPath());

        // 初始化同步数据，不触发
        if (value != null) {
            this.value = value;
        } else {
            this.form.setPathValue(this.getPath(), this.value, true);
        }

        this.validator.updateValue(this.value, false);

        // 监控其他字段的刷新
        this.form.absoluteWatch(this.id, [NestWatcher.combineKeys(getNestWatchPath(this.node))], () => {

            return new Promise((resolve): void => {
                setTimeout((): void => {
                    const onv: T = this.form.getPathValue(this.getPath());
                    const nv = onv === undefined ? this.initialValue : onv;

                    if (nv !== this.value) {
                        this.value = nv;
                        this.emit('repaint');

                        resolve(this.validate('change'));
                    }
                }, 0);
            });
        });

        this.validator.addListener(
            'change',
            result => {
                this.form.dispatchValidateResult(this.id, this.node, result);
                this.emit('repaint');
            }
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private getCache(): MemCache<any> | null {

        let node = this.node.parentNode;

        while (node) {

            const {cache} = node.getValue();

            if (cache) {
                return cache;
            }

            node = node.parentNode;
        }

        return null;
    }

    private setCacheValue(): void {

        const cache = this.getCache();
        const cachePath = NestWatcher.combineKeys(getNestCachePath(this.node));

        if (cache && cachePath) {
            cache.addCache(cachePath, this.value);
        }
    }

    private getCacheValue(): T | null {

        const cache = this.getCache();
        const cachePath = NestWatcher.combineKeys(getNestCachePath(this.node));

        if (cache && cachePath) {
            const cacheValue = cache.getCache(cachePath);

            if (cacheValue != null) {
                return cacheValue;
            }
        }

        return null;
    }
}
