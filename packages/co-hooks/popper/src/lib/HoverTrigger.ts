/**
 * @file HoverTrigger
 */

import {ITriggerOptions, Trigger} from './Trigger';

export interface IHoverTriggerOptions<T> extends ITriggerOptions<T> {
    showDelay?: number;
    hideDelay?: number;
}

export class HoverTrigger<T> extends Trigger<T> {

    private showDelay: number = 0;

    private hideDelay: number = 300;

    private showTimer: number = 0;

    private hideTimer: number = 0;

    public updateHoverTriggerOptions(options: Omit<IHoverTriggerOptions<T>, keyof ITriggerOptions<T>>): void {

        const {showDelay = 0, hideDelay = 300} = options;

        this.showDelay = showDelay;
        this.hideDelay = hideDelay;
    }

    public showPopper(): void {

        if (this.disabled) {
            return;
        }

        this.hideAbort();

        this.showTimer = window.setTimeout(() => {

            this.showAbort();

            if (this.triggerGroup) {
                this.triggerGroup.setActiveTrigger(this.id);
            }

            this.popper.showPopper(this.id);
        }, this.showDelay);
    }

    public hidePopper(): void {
        if (this.disabled) {
            return;
        }

        this.showAbort();

        this.hideTimer = window.setTimeout(() => {
            this.hideAbort();
            if (this.triggerGroup && this.id === this.triggerGroup.getActiveTrigger()) {
                this.triggerGroup.cancelActiveTrigger(this.id);
                this.popper.hidePopper(this.id);
            } else {
                this.popper.hidePopper(this.id);
            }
        }, this.hideDelay);
    }

    private showAbort(): void {
        clearTimeout(this.showTimer);
        this.showTimer = 0;
    }

    private hideAbort(): void {
        clearTimeout(this.hideTimer);
        this.hideTimer = 0;
    }
}
