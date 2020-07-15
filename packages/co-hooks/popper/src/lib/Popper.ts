/**
 * @file Popper
 */

import {guid} from '@co-hooks/util';
import {Popover} from './Popover';
import {ITrigger, Trigger} from './Trigger';
import {popperCore} from './PopperCore';

export class Popper<T> {

    private readonly id: string = guid();

    private triggerMap: {[key: string]: ITrigger<T>} = {};

    private popoverMap: {[key: string]: Popover<T>} = {};

    private showIds: string[] = [];

    constructor() {
        popperCore.addPopper(this);
    }

    public dispose(): void {

        Object.keys(this.triggerMap).forEach(id => {
            this.triggerMap[id] && this.triggerMap[id].dispose();
        });

        Object.keys(this.popoverMap).forEach(id => {
            this.popoverMap[id] && this.popoverMap[id].dispose();
        });

        this.triggerMap = {};
        this.popoverMap = {};
        this.showIds = [];

        popperCore.removePopper(this);
    }

    public registerTrigger(trigger: ITrigger<T>): void {

        const triggerId = trigger.getId();

        if (this.triggerMap[triggerId]) {
            console.error(`id=${triggerId} trigger component has been registered`);
            return;
        }

        this.triggerMap[triggerId] = trigger;
    }

    public unregisterTrigger(trigger: ITrigger<T>): void {

        const triggerId = trigger.getId();

        if (!this.triggerMap[triggerId]) {
            console.error(`id=${triggerId} trigger component unregister fail`);
            return;
        }

        // 清理因为Ref和LastTrigger
        Object.keys(this.popoverMap).forEach(key => {

            const popover = this.getPopover(key);

            if (!popover) {
                return;
            }

            let hasHide = false;

            if (popover.getRefTriggerId() === triggerId) {
                hasHide = true;
            }

            if (popover.getLastTrigger() === triggerId) {
                popover.setLastTrigger('');
                hasHide = true;
            }

            hasHide && popover.isShow() && popover.hidePopover();
        });

        delete this.triggerMap[triggerId];
    }

    public registerPopover(popover: Popover<T>): void {

        const popoverId = popover.getId();

        if (this.popoverMap[popoverId]) {
            console.error(`id=${popoverId} popover component has been registered`);
            return;
        }

        this.popoverMap[popoverId] = popover;
    }

    public unregisterPopover(popover: Popover<T>): void {

        const popoverId = popover.getId();

        if (!this.popoverMap[popoverId]) {
            console.error(`id=${popoverId} popover component unregister fail`);
            return;
        }

        delete this.popoverMap[popoverId];

        const idx = this.showIds.indexOf(popoverId);

        if (idx >= 0) {
            this.showIds.splice(idx, 1);
        }
    }

    public getTrigger(triggerId: string): ITrigger<T> {
        return this.triggerMap[triggerId];
    }

    public getPopover(popoverId: string): Popover<T> {
        return this.popoverMap[popoverId];
    }

    public getShowIds(): string[] {
        return this.showIds;
    }

    public getId(): string {
        return this.id;
    }

    public showPopper(triggerId: string): void {

        const trigger = this.triggerMap[triggerId];

        if (!trigger) {
            console.error(`id=${triggerId} trigger component does not exist`);
            return;
        }

        const triggerIdPath = trigger.getTriggerIdPath();
        const showIds: string[] = [];

        Object.keys(this.popoverMap).forEach(popoverId => {

            const popover = this.popoverMap[popoverId];
            const triggerIds = popover.getTriggerIds();
            const unionPopoverIds = popover.getUnionPopoverIds();

            if (showIds.indexOf(popoverId) >= 0) {
                return;
            }

            triggerIds.forEach(tid => {

                if (triggerIdPath.indexOf(tid) < 0) {
                    return;
                }

                showIds.push(popoverId);
                popover.setLastTrigger(triggerId);

                unionPopoverIds.forEach(pid => {
                    if (showIds.indexOf(pid) < 0) {
                        showIds.push(pid);
                    }
                });
            });
        });

        showIds.forEach(id => {
            this.popoverMap[id].showPopover();
        });
    }

    public hidePopper(triggerId: string): void {

        const trigger = this.triggerMap[triggerId];

        if (!trigger) {
            return;
        }

        const triggerIdPath = trigger.getTriggerIdPath();
        const needHideIds: string[] = [];

        Object.keys(this.popoverMap).forEach(popoverId => {

            const popover = this.popoverMap[popoverId];
            const triggerIds = popover.getTriggerIds();

            // TODO 逻辑待确认
            triggerIds.forEach(tid => {

                // tid在triggerIdPath上，能够保证triggerGroupId也被检测到
                // 只有popover.lastTrigger === triggerId才可以关闭popover，解决triggerGroup公用popover问题
                if (
                    triggerIdPath.indexOf(tid) >= 0
                    && popover.getLastTrigger() === triggerId
                    && needHideIds.indexOf(popoverId) < 0
                ) {
                    needHideIds.push(popoverId);
                }
            });
        });

        needHideIds.forEach(id => this.getPopover(id).hidePopover());
    }

    public updateRefRect(triggerId: string): void {

        this.showIds.forEach(id => {

            const popover = this.popoverMap[id];
            const refType = popover.getRefType();
            const refId = popover.getRefId();

            if ((refType === 'trigger' && refId === triggerId)
                || (refType === 'lastTrigger' && popover.getLastTrigger() === triggerId)
            ) {
                popover.updateRefRect();
            }
        });
    }

    public updatePopoverRect(popoverId: string): void {

        this.showIds.forEach(id => {

            const popover = this.popoverMap[id];
            const refType = popover.getRefType();
            const refId = popover.getRefId();

            if (refType === 'popover' && refId === popoverId) {
                popover.updateRefRect();
            }
        });
    }

    public setActiveShow(triggerId: string): void {

        const trigger = this.triggerMap[triggerId];

        if (trigger == null) {
            return;
        }

        trigger.setActiveShow(true);
    }

    public cancelActiveShow(triggerId: string): void {

        const trigger = this.triggerMap[triggerId];

        if (trigger == null) {
            return;
        }

        trigger.setActiveShow(false);
    }

    public isActiveShow(triggerId: string): boolean {

        const trigger = this.triggerMap[triggerId];

        if (trigger == null) {
            return false;
        }

        return (trigger as Trigger<T>).isActiveShow();
    }

    // popover同步popper.showIds状态
    public setPopoverShow(popoverId: string, show: boolean): void {

        if (!this.popoverMap[popoverId]) {
            return;
        }

        const idx = this.showIds.indexOf(popoverId);
        const lastTrigger = this.getTrigger(this.popoverMap[popoverId].getLastTrigger()) || null;

        if (show && idx < 0) {
            this.showIds.push(popoverId);
        } else if (!show && idx >= 0) {
            this.showIds.splice(idx, 1);
            lastTrigger && lastTrigger.setActiveShow(false);
        }
    }

    public syncSingleGroup(groupId: string, popoverId: string): void {

        Object.keys(this.popoverMap).forEach(key => {
            const popover = this.popoverMap[key];

            if (popover.getGroupId() !== groupId || popover.getId() === popoverId) {
                return;
            }

            popover.hidePopover();
        });
    }

    public hideAllPopover(triggerType?: string, excludeIds: string[] = []): void {

        const needHideIds: string[] = [];

        this.showIds.forEach((popoverId: string) => {

            const popover = this.popoverMap[popoverId];

            if (!popover || excludeIds.indexOf(popoverId) >= 0) {
                return;
            }

            if (!triggerType && needHideIds.indexOf(popoverId) < 0) {
                needHideIds.push(popoverId);
            }

            const triggerIds = popover.getTriggerIds();

            if (
                triggerIds.some(id => this.getTrigger(id).getTriggerType() === triggerType)
                && needHideIds.indexOf(popoverId) < 0
            ) {
                needHideIds.push(popoverId);
            }
        });

        needHideIds.forEach(id => this.getPopover(id).hidePopover());
    }

    public isTriggerFocus(triggerId: string): boolean {

        const ids = this.getShowIds();

        return ids.some(id => {

            const popover = this.getPopover(id);
            const refId = popover.getRefTriggerId();

            if (!refId && this.triggerMap[refId]) {
                return;
            }

            const trigger = this.getTrigger(refId);

            if (!trigger) {
                return false;
            }

            if (trigger.isGroup()) {
                return triggerId === trigger.getActiveTrigger();
            }

            return triggerId === refId;
        });
    }

    public isPopoverShow(id: string): boolean {
        return this.showIds.indexOf(id) >= 0;
    }
}
