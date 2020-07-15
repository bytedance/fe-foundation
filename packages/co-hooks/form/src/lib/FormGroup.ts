/**
 * @file FormGroup 表单容器
 */
import {DomNode} from '@co-hooks/dom-node';
import {Emitter} from '@co-hooks/emitter';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {guid} from '@co-hooks/util';
import {IValidateResult} from '@co-hooks/validate';
import {getRelativeKeys} from '../util';
import {FormDomNode, FormNode, FormNodeType, IField} from '../types';
import {FormField, IFormFieldEvent} from './FormField';
import {Form} from './Form';
import {FormRepeat} from './FormRepeat';

export interface IFormGroupOptions {
    field?: string;
    captureChildError?: boolean;
    errorProcessor?: (errors: string[]) => string;
    defaultValue?: unknown;
    repeat?: boolean;
}

export interface IFormGroupInfo extends Omit<IValidateResult, 'partial'> {
    scope: FormDomNode;
}

const DEFAULT_ERROR_PROCESSOR = (errors: string[]): string => errors[0];

export class FormGroup extends Emitter<IFormFieldEvent> implements IField {

    public readonly id: string = guid();

    public readonly form: Form;

    public readonly field: string;

    protected readonly node: FormDomNode;

    private captureChildError: boolean = false;

    private errorProcessor: (errors: string[]) => string = DEFAULT_ERROR_PROCESSOR;

    private readonly errors: Array<{id: string; msg: string}> = [];

    private valid: boolean = false;

    private msg: string = '';

    constructor(form: Form, scope: FormDomNode, options: Pick<IFormGroupOptions, 'field' | 'repeat' | 'defaultValue'>) {

        super();

        const {field = '', repeat = false, defaultValue = {}} = options;
        this.form = form;
        this.node = new DomNode<FormNode>({type: FormNodeType.GROUP, repeat, field, id: this.id}, scope);
        this.field = field;
        this.init(defaultValue);
    }

    public updateOptions(options: IFormGroupOptions): void {

        const {
            field = '',
            errorProcessor = DEFAULT_ERROR_PROCESSOR,
            captureChildError = false
        } = options;

        if (field !== this.field) {
            throw new Error('field should not be updated');
        }

        this.errorProcessor = errorProcessor;
        this.captureChildError = captureChildError;

        if (!captureChildError) {
            this.valid = true;
            this.msg = '';
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public isField(): this is FormField<any> {
        return false;
    }

    public isGroup(): this is FormGroup {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public isRepeat(): this is FormRepeat<any> {
        return false;
    }

    public reset(): void {
        this.msg = '';
    }

    public getGroupInfo(): IFormGroupInfo {

        if (!this.captureChildError) {
            return {
                msg: '',
                valid: true,
                scope: this.node
            };
        }

        return {
            msg: this.msg,
            valid: this.valid,
            scope: this.node
        };
    }

    public getNode(): FormDomNode {
        return this.node;
    }

    public getPath(): string {
        return NestWatcher.combineKeys(getRelativeKeys(this.node));
    }

    public processValidateResult(id: string, error?: IValidateResult): void {

        if (!this.captureChildError) {
            return;
        }

        const index = this.errors.findIndex(item => item.id === id);
        let updated = false;

        if (error == null || error.valid) {
            if (index >= 0) {
                this.errors.splice(index, 1);
                updated = true;
            }
        } else if (index < 0) {
            this.errors.push({
                id,
                msg: error.msg
            });
            updated = true;
        } else if (this.errors[index].msg !== error.msg) {
            this.errors[index].msg = error.msg;
            updated = true;
        }

        if (updated) {

            const msg = this.errorProcessor(this.errors.map(item => item.msg));
            const valid = this.errors.length <= 0;

            if (msg !== this.msg || this.valid !== valid) {
                this.msg = msg;
                this.valid = valid;
                this.emit('repaint');
            }
        }
    }

    public dispose(): void {
        this.form.unregister(this);
        this.form.unwatch(this.id);
        this.node.getChildNodes().forEach(node => this.form.disposeNode(node));
        this.node.remove();
    }

    protected init(defaultValue: unknown): void {

        this.form.register(this);

        if (this.field) {

            const value: unknown = this.form.getPathValue(NestWatcher.combineKeys(getRelativeKeys(this.node)));

            // 初始化同步数据，不触发
            if (value == null) {
                this.form.setPathValue(NestWatcher.combineKeys(getRelativeKeys(this.node)), defaultValue, true);
            }
        }
    }
}
