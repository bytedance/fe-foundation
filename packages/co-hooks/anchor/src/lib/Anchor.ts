/**
 * @file Anchor
 */
import {Emitter} from '@co-hooks/emitter';
import {getElementScroll, isClient} from '@co-hooks/dom';
import {AnchorItem} from './AnchorItem';

export interface IAnchorEvent {
    'active-item': [string];
}

export interface IAnchorOptions {
    getContainer?: () => HTMLElement;
    duration?: number;
    targetOffset?: number;
    activeDot?: boolean;
    hashLink?: boolean;
}

export class Anchor extends Emitter<IAnchorEvent> {

    private readonly itemMap: { [key: string]: AnchorItem } = {};

    private scrolling: boolean = false;

    private duration: number = 300;

    private targetOffset: number = 0;

    private activeId: string = '';

    private activeDot: boolean = false;

    private hashLink: boolean = true;

    public updateOptions(options: IAnchorOptions): void {
        const {
            getContainer,
            duration = 300,
            targetOffset = 0,
            activeDot = false,
            hashLink = true
        } = options;

        this.duration = duration;
        this.targetOffset = targetOffset;
        this.activeDot = activeDot;
        this.hashLink = hashLink;

        if (getContainer) {
            this.getContainer = getContainer;
        }
    }

    public getContainer(): HTMLElement | null {
        return isClient() ? document.documentElement : null;
    }

    public getTargetOffset(): number {
        return this.targetOffset;
    }

    public setScrolling(scrolling: boolean): void {
        this.scrolling = scrolling;
    }

    public getActiveDot(): boolean {
        return this.activeDot;
    }

    public getScrolling(): boolean {
        return this.scrolling;
    }

    public getActiveId(): string {
        return this.activeId;
    }

    public getHashLink(): boolean {
        return this.hashLink;
    }

    public updateAllItemOffsetTop(excludeId: string = ''): void {
        Object.keys(this.itemMap).forEach(id => {
            if (id === excludeId) {
                return;
            }

            this.itemMap[id].updateOffsetTop(true);
        });
    }

    public updateScrollTop(): void {
        const container = this.getContainer();
        if (!container) {
            return;
        }

        const scrollTop = getElementScroll(container).scrollTop;

        // bugfix: scrollTop return interger, getBoundingClientRect return float;
        const items = Object.values(this.itemMap)
            .filter(item => ~~item.getOffsetTop() - this.targetOffset <= scrollTop);

        if (!items.length) {
            return;
        }

        const activeItem = items.reduce(
            (item, nextItem) => (item.getOffsetTop() < nextItem.getOffsetTop() ? nextItem : item), items[0]);

        this.setActiveItem(activeItem.getId());
    }

    /**
     * 高亮某项 *场景：不足一屏时高亮生效
     */
    public setActiveItem(id: string): void {
        this.activeId = id;
        this.emit('active-item', id);
    }

    public registerAnchorItem(item: AnchorItem): void {
        this.itemMap[item.getId()] = item;
    }

    public unregisterAnchorItem(item: AnchorItem): void {
        const itemId = item.getId();

        if (!this.itemMap[itemId]) {
            return;
        }

        delete this.itemMap[itemId];
    }
}
