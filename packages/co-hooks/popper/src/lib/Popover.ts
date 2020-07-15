/**
 * @file Popover
 */
import {
    IElementPosition,
    IElementSize,
    IOffset,
    IOverFlowBoundaries,
    getDefaultElementPosition,
    getDefaultOffset,
    getDefaultOverflowBoundaries,
    getDocScroll,
    getWindowSize,
    isFixed
} from '@co-hooks/dom';
import {clone, guid, shallowEqual} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import * as CSS from 'csstype';
import {Popper} from './Popper';
import {ITrigger} from './Trigger';

export type IRcPlacementLeft = 'left-start' | 'left' | 'left-end';
export type IRcPlacementRight = 'right-start' | 'right' | 'right-end';
export type IRcPlacementTop = 'top-start' | 'top' | 'top-end';
export type IRcPlacementBottom = 'bottom-start' | 'bottom' | 'bottom-end';

export type IRcPlacement = IRcPlacementLeft | IRcPlacementRight | IRcPlacementTop | IRcPlacementBottom;

export type CSSProperties = CSS.Properties<string | number>;

export interface ITouch {
    touchX?: boolean;
    touchY?: boolean;
    fixed?: boolean;
}

export interface IArrowInfo {
    arrowStyle: CSSProperties;
    arrowDirection: string;
}

export const reversedDirection: {
    left: 'right';
    top: 'bottom';
    right: 'left';
    bottom: 'top';
} = {
    left: 'right',
    top: 'bottom',
    right: 'left',
    bottom: 'top'
};

export const touchReverse: {[key: string]: string} = {
    left: 'right',
    top: 'bottom',
    right: 'left',
    bottom: 'top'
};

export function getDefaultTouch(): ITouch {
    return {
        touchX: false,
        touchY: false,
        fixed: false
    };
}

export function getDefaultArrowInfo(placement?: IRcPlacement): IArrowInfo {
    const arrowInfo = {
        arrowStyle: {},
        arrowDirection: ''
    };

    if (!placement) {
        return arrowInfo;
    }

    const [dir] = placement.split('-');

    return Object.assign(arrowInfo, {
        arrowDirection: touchReverse[dir]
    });
}

export type IPopoverRefType = 'lastTrigger' | 'trigger' | 'popover';

export interface IPopoverOptions {
    refType?: IPopoverRefType;
    refId?: string;
    triggerIds?: string[];
    unionPopoverIds?: string[];
    show: boolean;
    placement?: IRcPlacement;
    offset?: IOffset;
    preventOverflow?: boolean;
    boundariesDetectionDebounce?: boolean;
    overflowBoundaries?: IOverFlowBoundaries;
    // 避免其他方向遮挡
    preventAroundOverflow?: boolean;
    arrow?: boolean;
    arrowOffset?: IOffset;
}

export interface IPopoverParams<T> {
    popper: Popper<T>;
    options: IPopoverOptions;
    id?: string;
    singleGroupId?: string;
}

export interface IPopoverEvent {
    'popover-style': [CSSProperties];
    'last-trigger-update': [];
    'popover-show': [boolean];
    'touch-change': [ITouch];
    'arrow-info-change': [IArrowInfo];
}

export type IOverDirection = 'top' | 'bottom' | 'left' | 'right';

export class Popover<T> extends Emitter<IPopoverEvent> {

    public arrowInfo: IArrowInfo = getDefaultArrowInfo();

    public arrow: boolean = false;

    private readonly id: string;

    private readonly singleGroupId: string;

    private readonly popper: Popper<T>;

    private triggerIds: string[] = [];

    private lastTrigger: string = '';

    private readonly sideDirectionDict: Record<IOverDirection, {
        sides: IOverDirection[];
        range: 'width' | 'height';
    }> = {
        top: {
            sides: ['left', 'right'],
            range: 'width'
        },
        bottom: {
            sides: ['left', 'right'],
            range: 'width'
        },
        left: {
            sides: ['top', 'bottom'],
            range: 'height'
        },
        right: {
            sides: ['top', 'bottom'],
            range: 'height'
        }
    };

    // lastTrigger 根据最终的activeTrigger定位
    // trigger  根据 refId 对应的trigger定位
    // popover  根据 refId 对应的popover定位
    private refType: IPopoverRefType = 'lastTrigger';

    // 触发popover show/hide 相对定位元素
    private refId: string = '';

    // 关联popover，保证show操作同步使用
    private unionPopoverIds: string[] = [];

    private placement: IRcPlacement = 'bottom-start';

    private offset: IOffset = getDefaultOffset();

    private preventOverflow: boolean = true;

    private boundariesDetectionDebounce: boolean = false;

    private overflowBoundaries: IOverFlowBoundaries = getDefaultOverflowBoundaries();

    private arrowOffset: IOffset = getDefaultOffset();

    private popoverTouch: ITouch = getDefaultTouch();

    private popover: HTMLElement | null = null;

    private popoverStyle: CSSProperties = {};

    private preventAroundOverflow: boolean = false;

    private rect: IElementPosition = getDefaultElementPosition();

    private disposed: boolean = false;

    constructor(params: IPopoverParams<T>) {

        super();

        this.id = params.id || guid();
        this.popper = params.popper;
        this.singleGroupId = params.singleGroupId || this.id;
        this.popper.registerPopover(this);
        this.updatePopoverOptions(params.options);
    }

    public updatePopover(element: HTMLElement | null): void {
        this.popover = element;
    }

    public updatePopoverOptions(options: IPopoverOptions): void {

        const {
            show,
            refType = 'lastTrigger',
            refId = '',
            triggerIds = [],
            unionPopoverIds = [],
            placement = 'bottom-start',
            offset = getDefaultOffset(),
            preventOverflow = true,
            overflowBoundaries = getDefaultOverflowBoundaries(),
            arrow = false,
            arrowOffset = getDefaultOffset(),
            preventAroundOverflow = false,
            boundariesDetectionDebounce = false
        } = options;

        this.refType = refType;
        this.refId = refId;
        this.triggerIds = triggerIds;
        this.unionPopoverIds = unionPopoverIds;
        this.placement = placement;
        this.offset = offset;
        this.preventOverflow = preventOverflow;
        this.boundariesDetectionDebounce = boundariesDetectionDebounce;
        this.overflowBoundaries = overflowBoundaries;
        this.preventAroundOverflow = preventAroundOverflow;
        this.arrow = arrow;
        this.arrowOffset = arrowOffset;
        this.popper.setPopoverShow(this.id, show);
        // placement 改变需 updatePopperStyle
        this.popoverStyle = this.updatePopperStyle();
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        this.popper.unregisterPopover(this);

        this.disposed = true;
    }

    public getId(): string {
        return this.id;
    }

    public getGroupId(): string {
        return this.singleGroupId;
    }

    public getPopoverStyle(): CSSProperties {
        return this.popoverStyle || {};
    }

    public getArrowStyle(): CSSProperties {
        return this.arrowInfo.arrowStyle || {};
    }

    public getPopoverFixed(): boolean {
        const ref = this.getPopover();

        if (ref == null) {
            return false;
        }

        return isFixed(ref);
    }

    public getTriggerIds(): string[] {
        return this.triggerIds;
    }

    public getRefId(): string {
        return this.refId;
    }

    public getRefType(): string {
        return this.refType;
    }

    public setLastTrigger(triggerId: string): void {
        this.lastTrigger = triggerId;
    }

    public getLastTrigger(): string {
        return this.lastTrigger;
    }

    public getUnionPopoverIds(): string[] {
        return this.unionPopoverIds;
    }

    public showPopover(): void {
        this.popoverStyle = this.updatePopperStyle();

        if (this.popper.isActiveShow(this.lastTrigger)) {
            this.emit('popover-style', this.popoverStyle);
            return;
        }

        this.popper.syncSingleGroup(this.getGroupId(), this.getId());
        this.popper.setActiveShow(this.lastTrigger);
        this.emit('last-trigger-update');
        this.emit('popover-show', true);
    }

    public hidePopover(): void {
        this.lastTrigger && this.popper.cancelActiveShow(this.lastTrigger);
        this.emit('popover-show', false);
    }

    public isShow(): boolean {
        return this.popper.isPopoverShow(this.id);
    }

    public updateRefRect(): void {
        this.popoverStyle = this.updatePopperStyle();

        if (this.isShow()) {
            this.emit('popover-style', this.popoverStyle);
        }
    }

    public updateRect(rect: IElementPosition): void {
        this.rect = rect;
        this.popoverStyle = this.updatePopperStyle();

        if (this.isShow()) {
            this.emit('popover-style', this.popoverStyle);
            this.popper.updatePopoverRect(this.id);
        }
    }

    public getRect(): IElementPosition {
        return this.rect;
    }

    public getTriggerData(): T | null {

        if (!this.lastTrigger) {
            return null;
        }

        return this.popper.getTrigger(this.lastTrigger).getData();
    }

    public onPopperMouseEnter(): void {
        if (!this.lastTrigger) {
            return;
        }

        const lastTrigger = this.popper.getTrigger(this.lastTrigger);

        if (!lastTrigger || lastTrigger.getTriggerType() !== 'hover') {
            return;
        }

        this.popper.getTrigger(this.lastTrigger).showPopper();
    }

    public onPopperMouseLeave(): void {
        if (!this.lastTrigger) {
            return;
        }

        const lastTrigger = this.popper.getTrigger(this.lastTrigger);

        if (!lastTrigger || lastTrigger.getTriggerType() !== 'hover') {
            return;
        }

        this.popper.getTrigger(this.lastTrigger).hidePopper();
    }

    public onPopperFocus(): void {
        if (!this.lastTrigger) {
            return;
        }

        const lastTrigger = this.popper.getTrigger(this.lastTrigger);

        if (!lastTrigger || lastTrigger.getTriggerType() !== 'focus') {
            return;
        }

        this.popper.getTrigger(this.lastTrigger).showPopper();
    }

    public onPopperBlur(): void {
        if (!this.lastTrigger) {
            return;
        }

        const lastTrigger = this.popper.getTrigger(this.lastTrigger);

        if (!lastTrigger || lastTrigger.getTriggerType() !== 'focus') {
            return;
        }

        this.popper.getTrigger(this.lastTrigger).hidePopper();
    }

    public getRefTriggerId(): string {

        const {refId, refType} = this;

        if (refType === 'trigger') {
            return refId;
        }

        if (refType === 'popover') {
            return '';
        }

        return this.getLastTrigger();
    }

    public getRefFixed(): boolean {

        try {
            switch (this.refType) {
                case 'trigger':
                    return this.popper.getTrigger(this.refId).isTriggerFixed();
                case 'popover':
                    return this.popper.getPopover(this.refId).getPopoverFixed();
                case 'lastTrigger':
                    return this.popper.getTrigger(this.lastTrigger).isTriggerFixed();
                default:
                    return false;
            }
        } catch (e) {
            return false;
        }
    }

    public getRefRect(): IElementPosition {

        let ref: ITrigger<T> | Popover<T> | null = null;

        switch (this.refType) {
            case 'trigger':
                ref = this.popper.getTrigger(this.refId);
                break;
            case 'popover':
                ref = this.popper.getPopover(this.refId);
                break;
            case 'lastTrigger':
                ref = this.popper.getTrigger(this.lastTrigger);
        }

        return ref ? ref.getRect() : getDefaultElementPosition();
    }

    private updatePopperStyle(): CSSProperties {

        const popoverRect: IElementPosition = {
            ...this.rect
        };
        const refRect = this.getRefRect();
        const {x, y} = this.getOffsetByPlacement();
        const left = refRect.left + x + (this.offset.x || 0);
        const top = refRect.top + y + (this.offset.y || 0);

        Object.assign(popoverRect, {
            left,
            top,
            right: left + popoverRect.width,
            bottom: top + popoverRect.height
        });

        const [touchPopperRect, touch] = this.getRectByOverflowBoundaries(
            popoverRect,
            this.popoverTouch
        );

        const fixed = this.getRefFixed() || touch.fixed;
        const popStyle: CSSProperties = {
            position: fixed ? 'fixed' : 'absolute'
        };

        let {scrollLeft, scrollTop} = getDocScroll();

        if (fixed) {
            scrollLeft = 0;
            scrollTop = 0;
        }

        if (this.preventOverflow && (touch.touchX || touch.touchY)) {
            popStyle.left = Math.floor(touchPopperRect.left + scrollLeft) + 'px';
            popStyle.top = Math.floor(touchPopperRect.top + scrollTop) + 'px';
        } else {
            popStyle.left = Math.floor(popoverRect.left + scrollLeft) + 'px';
            popStyle.top = Math.floor(popoverRect.top + scrollTop) + 'px';
        }

        if (this.arrow) {
            this.arrowInfo = this.getArrowInfo(popoverRect, touch);
            this.emit('arrow-info-change', this.arrowInfo);
        }

        if (!shallowEqual(this.popoverTouch, touch)) {
            this.popoverTouch = touch;
            this.emit('touch-change', touch);
        }

        return popStyle;
    }

    private getArrowInfo(
        popoverRect: IElementPosition,
        popoverTouch: ITouch
    ): IArrowInfo {
        const [direction, pos = 'center'] = this.placement.split('-');
        const {touchX, touchY} = popoverTouch;

        const arrowStyle: CSSProperties = {
            position: 'absolute',
            lineHeight: 0,
            fontSize: 0
        };

        const isVertical = direction === 'top' || direction === 'bottom';

        const axisPos: {[key: string]: {[key: string]: number}} = {
            vertical: {
                start: this.arrowOffset.y,
                center: popoverRect.height / 2 + this.arrowOffset.y,
                end: popoverRect.height + this.arrowOffset.y
            },
            horizontal: {
                start: this.arrowOffset.x,
                center: popoverRect.width / 2 + this.arrowOffset.x,
                end: popoverRect.width + this.arrowOffset.x
            }
        };

        const transformPos: {[key: string]: string} = {
            start: '0',
            center: '-50%',
            end: '-100%'
        };

        const dir = isVertical
            ? (touchY ? touchReverse[direction] : direction)
            : (touchX ? touchReverse[direction] : direction);

        switch (dir) {
            case 'right':
                Object.assign(arrowStyle, {
                    left: 0,
                    transform: `translate(-100%, ${transformPos[pos]})`,
                    top: axisPos.vertical[pos] + 'px'
                });
                break;
            case 'left':
                Object.assign(arrowStyle, {
                    left: popoverRect.width + 'px',
                    transform: `translate(0, ${transformPos[pos]})`,
                    top: axisPos.vertical[pos] + 'px'
                });
                break;
            case 'bottom':
                Object.assign(arrowStyle, {
                    top: 0,
                    transform: `translate(${transformPos[pos]}, -100%)`,
                    left: axisPos.horizontal[pos] + 'px'
                });
                break;
            case 'top':
                Object.assign(arrowStyle, {
                    top: popoverRect.height + 'px',
                    transform: `translate(${transformPos[pos]}, 0)`,
                    left: axisPos.horizontal[pos] + 'px'
                });
                break;
        }

        return {
            arrowStyle,
            arrowDirection: touchReverse[dir]
        };
    }

    private getOffsetByPlacement(): IOffset {
        const [direction, pos = 'center'] = this.placement.split('-');
        const {width: popoverWidth, height: popoverHeight} = this.rect;
        const {width: refWidth, height: refHeight} = this.getRefRect();
        const res = getDefaultOffset();

        const axisOffset: {[key: string]: {[key: string]: number}} = {
            vertical: {
                start: 0,
                center: (refWidth - popoverWidth) / 2,
                end: refWidth - popoverWidth
            },
            horizontal: {
                start: 0,
                center: (refHeight - popoverHeight) / 2,
                end: refHeight - popoverHeight
            }
        };

        switch (direction) {
            case 'top':
                Object.assign(res, {
                    y: -popoverHeight,
                    x: axisOffset.vertical[pos]
                });
                break;
            case 'bottom':
                Object.assign(res, {
                    y: refHeight,
                    x: axisOffset.vertical[pos]
                });
                break;
            case 'left':
                Object.assign(res, {
                    y: axisOffset.horizontal[pos],
                    x: -popoverWidth
                });
                break;
            case 'right':
                Object.assign(res, {
                    y: axisOffset.horizontal[pos],
                    x: refWidth
                });
                break;
        }

        return res;
    }

    // 获取当前视口的boundaries
    private getAvailBoundaries(): Required<IOverFlowBoundaries> {
        const {left = 0, top = 0, right = 0, bottom = 0} = this.overflowBoundaries;
        const {width, height} = getWindowSize();

        return {
            left,
            top,
            right: width - right,
            bottom: height - bottom
        };
    }

    private getRectByOverflowBoundaries(
        popoverRect: IElementPosition,
        currentTouch: ITouch
    ): [IElementPosition, ITouch] {
        const newRect = clone(popoverRect);
        const availBoundaries = this.getAvailBoundaries();
        const direction = this.placement.split('-')[0] as keyof IOverFlowBoundaries;
        let isVertical = direction === 'top' || direction === 'bottom';
        const res: ITouch = getDefaultTouch();
        const refRect = this.getRefRect();
        const shouldFlip = (
            this.boundariesDetectionDebounce
                && currentTouch[isVertical ? 'touchY' : 'touchX'])
            || this.isRectOverBoundary(availBoundaries, newRect, direction);

        // 调整位置后 * bugfix: 前置检测
        if (shouldFlip) {
            const reversedDir = reversedDirection[direction];
            const nextValue = refRect[reversedDir] - this.offset[isVertical ? 'y' : 'x'];
            const flippedRect = {...newRect};
            this.assignRectValue(flippedRect, direction, nextValue);

            // 翻转位置后仍然超出边界，使用原先的位置，否则使用翻转后的 rect
            if (this.isRectOverBoundary(availBoundaries, flippedRect, reversedDir)) {
                this.assignRectValue(newRect, direction, nextValue);
            } else {
                res[isVertical ? 'touchY' : 'touchX'] = true;
                Object.assign(newRect, flippedRect);
            }
        }

        // 其他方向检测: 例如右对齐同时底部空间不够（menu）
        const {sides, range} = this.sideDirectionDict[direction];
        if (!this.preventAroundOverflow || newRect[range] > getWindowSize()[range]) {
            return [newRect, res];
        }

        for (const side of sides) {
            if (this.isRectOverBoundary(availBoundaries, newRect, side)) {
                const isVertical = side === 'top' || side === 'bottom';
                res[isVertical ? 'touchY' : 'touchX'] = true;
                const nextValue = availBoundaries[side];
                this.assignRectValue(newRect, side, nextValue);

                // 调整位置后仍然超出边界，则使用 fixed 绝对定位
                // if (this.isRectOverBoundary(availBoundaries, newRect, side)) {
                //     res.fixed = true;
                //     this.assignRectValue(newRect, side, availBoundaries[side]);
                // }
                break;
            }
        }

        return [newRect, res];
    }

    private getPopover(): HTMLElement | null {
        return this.popover || null;
    }

    private assignRectValue(
        rect: IElementPosition,
        direction: Exclude<keyof IElementPosition, keyof IElementSize>,
        value: number
    ): void {
        if (direction === 'top') {
            rect.top = value;
            rect.bottom = rect.top + rect.height;
        } else if (direction === 'left') {
            rect.left = value;
            rect.right = rect.left + rect.width;
        } else if (direction === 'right') {
            rect.right = value;
            rect.left = rect.right - rect.width;
        } else {
            rect.bottom = value;
            rect.top = rect.bottom - rect.height;
        }
    }

    private isRectOverBoundary(
        boundary: Required<IOverFlowBoundaries>,
        rect: IElementPosition,
        direction: (keyof IOverFlowBoundaries) & (keyof IElementPosition)
    ): boolean {
        if (direction === 'top' || direction === 'left') {
            return boundary[direction] > rect[direction];
        }
        return boundary[direction] < rect[direction];
    }
}
