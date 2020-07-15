/**
 * @file Trigger 触发器
 */

import {Emitter} from '@co-hooks/emitter';
import {
    IElementPosition,
    IElementPositionCaptureOptions,
    getDefaultElementPosition,
    getElementPosition,
    isFixed
} from '@co-hooks/dom';
import {guid} from '@co-hooks/util';
import {Popper} from './Popper';
import {TriggerGroup} from './TriggerGroup';

export interface ITriggerOptions<T> {
    disabled?: boolean;
    captureOptions?: IElementPositionCaptureOptions;
    disableToggleClose?: boolean;
    data?: T;
}

export interface ITrigger<T> {
    isTriggerFixed: () => boolean;
    setActiveShow: (show: boolean) => void;
    getRect: () => IElementPosition;
    getData: () => T | null;
    getId: () => string;
    showPopper: () => void;
    hidePopper: () => void;
    isGroup: () => this is TriggerGroup<T>;
    getTriggerType: () => string;
    getTriggerIdPath: () => string[];
    getDisableToggleClose: () => boolean;
    dispose: () => void;
}

export type TriggerType = 'hover' | 'click' | 'focus' | 'manual';

export interface ITriggerEvent {
    'update-active': [boolean];
}

export class Trigger<T> extends Emitter<ITriggerEvent> implements ITrigger<T> {

    public readonly triggerType: TriggerType = 'manual';

    protected readonly popper: Popper<T>;

    protected disabled?: boolean = false;

    protected readonly triggerGroup?: TriggerGroup<T>;

    protected readonly id: string;

    private data: T | null = null;

    private reference: HTMLElement | null = null;

    private rect: IElementPosition = getDefaultElementPosition();

    private activeShow: boolean = false;

    private disposed: boolean = false;

    private disableToggleClose: boolean = false;

    constructor(
        popper: Popper<T>,
        triggerType: TriggerType,
        id?: string,
        triggerGroup?: TriggerGroup<T>
    ) {

        super();

        this.id = id || guid();
        this.triggerType = triggerType;
        this.popper = popper;
        this.triggerGroup = triggerGroup;

        this.popper.registerTrigger(this);

        if (this.triggerGroup) {
            this.triggerGroup.registerTrigger(this);
        }
    }

    public updateReference(reference: HTMLElement | null): void {
        this.reference = reference;
    }

    public updateTriggerOptions(options: ITriggerOptions<T>): void {

        const {disabled = false, data = null, disableToggleClose = false} = options;

        this.disabled = disabled;
        this.data = data;
        this.disableToggleClose = disableToggleClose;
    }

    public dispose(): void {

        if (this.disposed) {
            return;
        }

        this.popper.unregisterTrigger(this);

        if (this.triggerGroup) {
            this.triggerGroup.unregisterTrigger(this);
        }

        this.disposed = true;
    }

    public isTriggerFixed(): boolean {

        const ref = this.getReference();

        if (ref == null) {
            return false;
        }

        return isFixed(ref);
    }

    public updateRect(rect: IElementPosition): void {
        this.rect = rect;
        this.popper.updateRefRect(this.id);
    }

    public getRect(): IElementPosition {
        // 如果在不监控trigger位置的时候获取rect，手动获取一次
        if (!this.isFocus() && !this.isActiveShow()) {
            this.rect = this.reference ? getElementPosition(this.reference) : this.rect;
        }
        return this.rect;
    }

    public getData(): T | null {
        return this.data;
    }

    public getId(): string {
        return this.id;
    }

    public getDisableToggleClose(): boolean {
        return this.disableToggleClose;
    }

    public showPopper(): void {

        if (this.disabled) {
            return;
        }

        if (this.triggerGroup) {
            this.triggerGroup.setActiveTrigger(this.id);
        }

        this.popper.showPopper(this.id);
    }

    public hidePopper(): void {

        if (this.disabled) {
            return;
        }

        if (this.triggerGroup && this.id === this.triggerGroup.getActiveTrigger()) {
            this.triggerGroup.cancelActiveTrigger(this.id);
            this.popper.hidePopper(this.id);
        } else {
            this.popper.hidePopper(this.id);
        }
    }

    public setActiveShow(show: boolean): void {
        this.activeShow = show;
        this.emit('update-active', this.activeShow);
    }

    public isActiveShow(): boolean {
        return this.activeShow;
    }

    public isFocus(): boolean {
        return this.popper.isTriggerFocus(this.id);
    }

    public isGroup(): boolean {
        return false;
    }

    public getTriggerIdPath(): string[] {
        const res = [this.id];

        if (!this.triggerGroup) {
            return res;
        }

        return this.triggerGroup.getTriggerIdPath().concat(res);
    }

    public getTriggerType(): string {
        return this.triggerType;
    }

    private getReference(): HTMLElement | null {
        return this.reference;
    }
}
