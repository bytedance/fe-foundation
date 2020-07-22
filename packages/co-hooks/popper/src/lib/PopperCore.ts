/**
 * @file PopperCore
 */
import {DocClickHandler, isClient} from '@rc-hooks/dom';
import {Popper} from './Popper';
import {Trigger} from './Trigger';

const DATA_SET_ID_TAG = Symbol('__dataSetIds__');

export interface IDocumentClickEvent extends MouseEvent {
    [DATA_SET_ID_TAG]: string[];
}

export class PopperCore {

    public popperMap: {[key: string]: Popper<unknown>} = {};

    private eventFlag: boolean = false;

    public addPopper(popper: Popper<unknown>): void {
        this.popperMap[popper.getId()] = popper;
    }

    public removePopper(popper: Popper<unknown>): void {

        const id = popper.getId();

        if (this.popperMap[id]) {
            delete this.popperMap[id];
        }

        if (!Object.keys(this.popperMap).length) {
            this.eventFlag = false;
            if (isClient()) {
                document.removeEventListener('click', this.onDocumentClickCapture, true);
                document.removeEventListener('click', this.onDocumentClick);
            }
        }
    }

    public initPopperCoreEvent(): void {

        if (!this.eventFlag) {

            this.eventFlag = true;
            if (isClient()) {
                document.addEventListener('click', this.onDocumentClickCapture, true);
                document.addEventListener('click', this.onDocumentClick);
            }
        }
    }

    public onDocumentClickCapture: DocClickHandler = (e: MouseEvent): void => {

        const target = e.target as HTMLElement;

        let dataSetId: string[] = [];
        let ele: HTMLElement | null = target;

        while (ele && ele !== document.body) {

            if (ele.nodeType === 1) {
                const id = ele.getAttribute('data-rc-id') || '';

                if (id) {
                    dataSetId.push(id);
                }
            }

            ele = ele.parentNode as HTMLElement;
        }

        (e as IDocumentClickEvent)[DATA_SET_ID_TAG] = dataSetId;
    };

    public onDocumentClick: DocClickHandler = (e: MouseEvent): void => {

        let dataSetId: string[] = (e as IDocumentClickEvent)[DATA_SET_ID_TAG] || [];

        const popperList = this.getPopperList();

        if (!dataSetId.length) {

            popperList.forEach(popper => {
                popper.hideAllPopover('click');
            });
            return;
        }

        // 收集popover信息，确定不需要关闭的popover
        const popoverIdsMap: {[key: string]: boolean} = {};

        dataSetId.forEach(setId => {

            const [type, id] = setId.split('___');

            if (type === 'popover') {
                popoverIdsMap[id] = true;
            }
        });

        let excludeIds: string[] = [];

        // 保留相关的click popover，关闭不相关的popover
        Object.keys(popoverIdsMap).forEach(popoverId => {

            popperList.forEach(popper => {

                const showIds = popper.getShowIds();

                if (showIds.indexOf(popoverId) >= 0) {
                    const popoverUnionIds = popper.getPopover(popoverId).getUnionPopoverIds();
                    excludeIds = excludeIds.concat([popoverId, ...popoverUnionIds]);
                }
            });
        });

        const setId = dataSetId[0];
        const [type, id] = setId.split('___');

        if (type !== 'trigger') {
            popperList.forEach(popper => popper.hideAllPopover('click', excludeIds));
            return;
        }

        popperList.forEach(popper => {

            const trigger = popper.getTrigger(id);

            if (!trigger || trigger.getTriggerType() !== 'click') {
                popper.hideAllPopover('click', excludeIds);
                return;
            }

            if ((trigger as Trigger<unknown>).isActiveShow() && !trigger.getDisableToggleClose()) {
                popper.hideAllPopover('click', excludeIds);
                return;
            }

            popper.hideAllPopover('click', excludeIds);
            trigger.showPopper();
        });
    };

    private getPopperList(): Array<Popper<unknown>> {
        return Object.keys(this.popperMap).map(id => this.popperMap[id]);
    }
}

export const popperCore = new PopperCore();

