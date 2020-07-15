/**
 * @file Validator 验证器
 */
import {Emitter} from '@co-hooks/emitter';
import {deepEqual, shallowEqual} from '@co-hooks/util';
import {PriorityQueue} from '@co-hooks/priority-queue';
import {IValidateResult, IValidateRule, TriggerTypeMap, ValidateTriggerType} from '../types';
import {validate} from '../util';

export interface IValidatorEvents {
    change: [IValidateResult];
}

function getDefaultValidateResult(needValidate: boolean = false): IValidateResult {
    return {
        valid: true,
        partial: needValidate,
        msg: ''
    };
}

export class Validator<T> extends Emitter<IValidatorEvents> {

    private value: unknown;

    private result: IValidateResult = getDefaultValidateResult();

    private rules: Array<IValidateRule<T>> = [];

    private manual: boolean = false;

    // 当前Level中的最大校验级别
    private state: ValidateTriggerType = 'reset';

    private readonly validateQueue: PriorityQueue = this.initValidateQueue();

    private readonly context: T;

    constructor(context: T) {
        super();
        this.context = context;
    }

    public updateRules(rules: Array<IValidateRule<T>>): boolean {

        if (!deepEqual(this.rules, rules)) {
            this.rules = rules;
            if (this.state === 'reset') {
                this.result = getDefaultValidateResult(this.rules.length > 0);
            }
            return true;
        }

        return false;
    }

    public updateValue(value: unknown, manual: boolean = false): boolean {

        this.manual = this.manual || manual;

        if (this.value !== value) {
            this.value = value;

            // 第一次manual或者当前的校验级别已经被设置过
            if (this.manual || this.state !== 'reset') {
                return true;
            }
        }

        return false;
    }

    public validate(state?: ValidateTriggerType): Promise<void> {

        const level = state ? state : this.manual ? 'change' : 'reset';

        if (TriggerTypeMap[this.state] < TriggerTypeMap[level]) {
            this.state = level;
        }

        return this.validateQueue.execute('validate', null);
    }

    public getValidateInfo(): IValidateResult & {manual: boolean} {
        return {
            manual: this.manual,
            ...this.result
        };
    }

    public reset(): void {
        this.result = getDefaultValidateResult(this.rules.length > 0);
        this.manual = false;
        this.state = 'reset';
        this.emit('change', this.result);
    }

    public dispose(): void {
        // 要先执行reset，然后才能销毁事件
        this.reset();
        this.removeAllListeners('change');
    }

    private initValidateQueue(): PriorityQueue {

        return new PriorityQueue([
            {
                key: 'validate',
                fn: () => validate(this.context, this.rules, this.value, this.state)
                    .then(result => {
                        // the state must be reset after each execution
                        this.state = 'reset';

                        // 状态和提示信息和之前的相同
                        if (shallowEqual(result, this.result)) {
                            return;
                        }
                        this.result = result;

                        this.emit('change', result);
                    })
            }
        ]);
    }
}
