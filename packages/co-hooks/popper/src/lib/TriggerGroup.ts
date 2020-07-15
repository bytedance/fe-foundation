/**
 * @file TriggerGroup
 */

import {IElementPosition, getDefaultElementPosition} from '@co-hooks/dom';
import {guid} from '@co-hooks/util';
import {Popper} from './Popper';
import {ITrigger} from './Trigger';

export class TriggerGroup<T> implements ITrigger<T> {

    private readonly id: string;

    private activeTrigger: string = '';

    private readonly popper: Popper<T>;

    private readonly parent: TriggerGroup<T> | null = null;

    private readonly triggerMap: {[key: string]: ITrigger<T>} = {};

    private disposed: boolean = false;

    constructor(popper: Popper<T>, parent?: TriggerGroup<T>, triggerId?: string) {

        this.popper = popper;
        this.parent = parent || null;
        this.id = triggerId || guid();

        this.init();
    }

    public getId(): string {
        return this.id;
    }

    public getRect(): IElementPosition {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return getDefaultElementPosition();
        }

        return trigger.getRect();
    }

    public getData(): T | null {

        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return null;
        }

        return trigger.getData();
    }

    public getTriggerType(): string {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return 'manual';
        }

        return trigger.getTriggerType();
    }

    public getDisableToggleClose(): boolean {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return false;
        }

        return trigger.getDisableToggleClose();
    }

    public isTriggerFixed(): boolean {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return false;
        }

        return trigger.isTriggerFixed();
    }

    public setActiveShow(show: boolean): void {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return;
        }

        trigger.setActiveShow(show);
    }

    public setActiveTrigger(triggerId: string): void {
        const trigger = this.triggerMap[triggerId];

        if (!trigger) {
            return;
        }

        if (this.activeTrigger !== triggerId) {
            this.triggerMap[this.activeTrigger]
            && this.triggerMap[this.activeTrigger].setActiveShow(false);
        }

        this.activeTrigger = triggerId;

        // 设置父级的TG的activeTrigger
        if (this.parent) {
            this.parent.setActiveTrigger(this.id);
        }
    }

    public cancelActiveTrigger(triggerId: string): void {
        if (this.activeTrigger !== triggerId) {
            return;
        }

        this.activeTrigger = '';

        // 清空父级的TG的activeTrigger
        if (this.parent) {
            this.parent.cancelActiveTrigger(this.id);
        }
    }

    public getActiveTrigger(): string {
        return this.activeTrigger;
    }

    public showPopper(): void {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return;
        }

        trigger.showPopper();
    }

    public hidePopper(): void {
        const trigger = this.triggerMap[this.activeTrigger];

        if (trigger == null) {
            return;
        }

        trigger.hidePopper();
    }

    public isGroup(): boolean {
        return true;
    }

    public getTriggerIdPath(): string[] {
        const res = [this.id];

        if (!this.parent) {
            return res;
        }

        return this.parent.getTriggerIdPath().concat(res);
    }

    public registerTrigger(trigger: ITrigger<T>): void {
        this.triggerMap[trigger.getId()] = trigger;
    }

    public unregisterTrigger(trigger: ITrigger<T>): void {
        const triggerId = trigger.getId();

        if (this.triggerMap[triggerId]) {
            delete this.triggerMap[triggerId];
        }
    }

    public dispose(): void {

        if (this.disposed) {
            return;
        }

        // Group没用了，估计子类也没啥用了
        Object.keys(this.triggerMap).forEach(key => {
            this.triggerMap[key] && this.triggerMap[key].dispose();
        });

        if (this.parent) {
            this.parent.unregisterTrigger(this);
        }

        this.popper.unregisterTrigger(this);

        this.disposed = true;
    }

    private init(): void {

        if (this.parent) {
            this.parent.registerTrigger(this);
        }

        this.popper.registerTrigger(this);
    }
}
