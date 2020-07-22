/**
 * @file Draggable
 */
import {Emitter} from '@co-hooks/emitter';
import {
    IElementPosition,
    IOffset,
    IOverFlowBoundaries,
    getDefaultElementPosition,
    getDefaultOverflowBoundaries,
    getDocScroll,
    getZIndex,
    isClient
} from '@co-hooks/dom';
import {Drag, IDrag, IDragEvent, IMousePos} from '@co-hooks/drag';

export interface IDraggablePos {
    targetPos: IElementPosition;
    containerPos: IElementPosition;
}

export type IScrollHorizontalDirection = 'left' | 'right';

export type IScrollVerticalDirection = 'top' | 'bottom';

export type IScrollDirection = [IScrollHorizontalDirection | null, IScrollVerticalDirection | null];

export type IDraggableDirection = 'horizontal' | 'vertical' | 'auto';

export type IDragType = 'move' | 'copy' | 'move-self';

export interface IDraggableEvent<T> extends IDragEvent<T> {
    startPos: IDraggablePos;
    dragType: IDragType;
    offset: IOffset;
}

export interface IDraggableOptions<T> extends IDrag<T> {

    // 获取拖拽的类型
    getDragType: (e: IDragEvent<T>) => IDragType;

    // 相对container进行定位，
    getContainer: (e: IDragEvent<T>) => HTMLElement | null;

    // 拖拽的方向
    direction?: IDraggableDirection;

    // 是否可以拖出容器container
    overflow?: boolean;

    // 若不可拖出，额外可拖出$container的四个方向的偏移
    overflowBoundaries?: IOverFlowBoundaries;

    // 是否停留边界触发滚动
    scrollable?: boolean;

    // 停留边界偏移量
    scrollableBoundaries?: IOverFlowBoundaries;

    // 停留时长
    scrollableDelay?: number;

    // 滚动步长，16.6ms触发一次
    scrollStep?: number;

    // 自动跟随
    autoFlow?: boolean;

    // 拖拽的透明度
    dragOpacity?: number;

    // 拖拽的ZIndex
    dragZIndex?: number;
}

export function getDefaultScrollableBoundaries(): IOverFlowBoundaries {

    return {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };
}

export function getDefaultScrollDirection(): IScrollDirection {
    return [null, null];
}

export interface IDraggableEventType<T> {
    'drag-prepare': [IDraggableEvent<T>];
    'drag-start': [IDraggableEvent<T>];
    'dragging': [IDraggableEvent<T>];
    'drag-end': [IDraggableEvent<T>];
    'scroll-start': [IScrollDirection];
    'before-create-action-ele': [Draggable<T>];
    'scroll-end': [];
}

export class Draggable<T> extends Emitter<IDraggableEventType<T>> {

    private static getOffsetPosition(
        ele: HTMLElement | null,
        offsetEle?: HTMLElement
    ): IElementPosition {
        if (!ele) {
            return getDefaultElementPosition();
        }

        const {left, top, width, height} = ele.getBoundingClientRect();
        const {scrollTop, scrollLeft} = getDocScroll();
        const res: IElementPosition = {
            ...getDefaultElementPosition(),
            width,
            height
        };

        if (offsetEle) {

            const {left: offsetEleLeft, top: offsetEleTop} = offsetEle.getBoundingClientRect();

            res.left = offsetEleLeft - left;
            res.top = offsetEleTop - top;
        } else {
            res.left = left + scrollLeft;
            res.top = top + scrollTop;
        }

        res.right = res.left + width;
        res.bottom = res.top + height;

        return res;
    }

    private static setOffset(ele: HTMLElement, offset: Partial<IOffset>): void {

        const {x, y} = offset;
        const {position, left: styleLeft, top: styleTop} = window.getComputedStyle(ele);

        if (position === 'static') {
            ele.style.position = 'relative';
        }

        const {left: offsetLeft, top: offsetTop} = Draggable.getOffsetPosition(ele);

        if (x != null) {
            ele.style.left = `${(parseFloat(styleLeft || '0') || 0) + (x - offsetLeft)}px`;
        }

        if (y != null) {
            ele.style.top = `${(parseFloat(styleTop || '0') || 0) + (y - offsetTop)}px`;
        }
    }

    public actionEle?: HTMLElement;

    protected startStyle?: string;

    protected getContainer?: (e: IDragEvent<T>) => HTMLElement | null;

    protected container: HTMLElement | null = isClient() ? document.body : null;

    private readonly drag: Drag<T> = new Drag();

    private direction: string = 'auto';

    private overflow: boolean = true;

    private overflowBoundaries: IOverFlowBoundaries = getDefaultOverflowBoundaries();

    private scrollable: boolean = true;

    private scrollableBoundaries: IOverFlowBoundaries = getDefaultScrollableBoundaries();

    private scrollableDelay: number = 10;

    private scrollStep: number = 3;

    private autoFlow: boolean = true;

    private dragOpacity: number = 0.5;

    private dragZIndex: number = getZIndex();

    // 拖拽开始位置
    private startPos?: IDraggablePos;

    // 判断停留间隔timeId
    private scrollableTimeId: number = 0;

    // 滚动setInterval的timeId
    private scrollTimeId: number = 0;

    // 滚动方向
    private scrollDirection: IScrollDirection = getDefaultScrollDirection();

    // 是否在滚动
    private isStartScroll: boolean = false;

    // 拖拽类型
    private dragType: IDragType = 'copy';

    // 是否在拖动
    private dragging: boolean = false;

    constructor() {

        super();
        this.init();
    }

    public updateDraggableOptions(options: IDraggableOptions<T>): void {

        const {
            draggable,
            trigger,
            data,
            getContainer,
            direction = 'auto',
            overflow = true,
            overflowBoundaries = getDefaultOverflowBoundaries(),
            scrollable = true,
            scrollableBoundaries = getDefaultScrollableBoundaries(),
            scrollableDelay = 10,
            scrollStep = 3,
            autoFlow = true,
            dragOpacity = 0.5,
            dragZIndex = getZIndex(),
            getDragType,
            dragLimit
        } = options;

        this.drag.updateOptions({draggable, trigger, data, dragLimit});
        this.direction = direction;
        this.overflow = overflow;
        this.overflowBoundaries = overflowBoundaries;
        this.scrollable = scrollable;
        this.scrollableBoundaries = scrollableBoundaries;
        this.scrollableDelay = scrollableDelay;
        this.scrollStep = scrollStep;
        this.autoFlow = autoFlow;
        this.dragOpacity = dragOpacity;
        this.dragZIndex = dragZIndex;
        this.getDragType = getDragType;
        this.getContainer = getContainer;
    }

    public updateTarget(ele: HTMLElement): void {

        if (ele !== this.drag.getElem()) {
            this.drag.init(ele);
        }
    }

    public getActionEle(): HTMLElement | null {
        return this.actionEle || null;
    }

    public getTarget(): HTMLElement | null {
        return this.drag.getElem() || null;
    }

    public dispose(): void {

        this.cancelDrag();
        this.drag.removeAllListeners();
        this.drag.dispose();
    }

    protected handleDragPrepare(e: IDragEvent<T>): void {

        const {target} = e;

        const container = this.getContainer && this.getContainer(e);

        if (container == null) {
            this.cancelDrag();
            return;
        }

        const startPos = this.startPos = {
            targetPos: Draggable.getOffsetPosition(target),
            containerPos: Draggable.getOffsetPosition(this.container)
        };
        this.container = container;
        this.dragging = true;
        this.dragType = this.getDragType(e);
        this.emit('drag-prepare', {
            ...e,
            dragType: this.dragType,
            offset: {x: 0, y: 0},
            startPos
        });
    }

    protected handleDragStart(e: IDragEvent<T>): void {

        const {dragOpacity, dragType, dragZIndex, startPos, dragging} = this;

        if (!dragging) {
            return;
        }

        this.createActionEle(e);

        if (!this.actionEle || !startPos) {
            this.cancelDrag();
            return;
        }

        Object.assign(this.actionEle.style, {
            position: 'absolute',
            opacity: dragOpacity,
            top: startPos.targetPos.top,
            left: startPos.targetPos.left
        });

        if (dragType !== 'move-self') {
            Object.assign(this.actionEle.style, {
                zIndex: dragZIndex
            });
        }

        this.emit('drag-start', {
            ...e,
            dragType,
            offset: {x: 0, y: 0},
            startPos
        });
    }

    protected handleDragging(e: IDragEvent<T>): void {

        const {startMousePos, currentMousePos} = e;
        const {autoFlow, dragType, startPos, dragging} = this;

        if (!dragging) {
            this.cancelDrag();
            return;
        }

        if (!startPos) {
            console.warn('startPos does not exist');
            this.cancelDrag();
            return;
        }

        const offset = this.calcTargetOffset(startPos, startMousePos, currentMousePos);

        this.emit('dragging', {
            ...e,
            dragType,
            offset,
            startPos
        });

        if (autoFlow && this.actionEle) {
            Draggable.setOffset(this.actionEle, offset);
        }

        if (!this.scrollable) {
            return;
        }

        const scrollDir = this.detectScroll(e);

        if (scrollDir == null) {
            this.abortScrollableTime();
            this.scrollDirection = getDefaultScrollDirection();
        } else if (this.scrollDirection.join('-') !== scrollDir.join('-')) {
            this.abortScrollableTime();
            this.scrollDirection = scrollDir;
            this.startScrollableTime();
        }
    }

    protected handleDragEnd(e: IDragEvent<T>): void {

        const {startMousePos, currentMousePos} = e;
        const {startPos} = this;

        if (!startPos) {
            console.warn('startPos does not exist');
            this.cancelDrag();
            return;
        }

        const offset = this.calcTargetOffset(startPos, startMousePos, currentMousePos);

        this.cancelDrag();

        this.emit('drag-end', {
            ...e,
            dragType: this.dragType,
            startPos,
            offset
        });
    }

    protected getDragType(e: IDragEvent<T>): IDragType {
        throw new Error('you must provide the `getDragType` option');
    }

    protected createActionEle(e: IDragEvent<T>): void {

        const {dragType} = this;
        const target = e.target;
        const {width, height} = window.getComputedStyle(target);

        if (dragType === 'move-self') {
            this.actionEle = target;
            this.startStyle = this.actionEle.style.cssText;
        } else {
            // 只有复制才会触发
            this.emit('before-create-action-ele', this);
            this.actionEle = target.cloneNode(true) as HTMLElement;
            document.body.appendChild(this.actionEle);

            if (dragType === 'move') {
                this.startStyle = this.actionEle.style.cssText;
                Object.assign(e.target.style, {display: 'none'});
            }
        }

        // 设置样式，必须优先设置宽高，改了position，宽高的计算可能出错
        Object.assign(this.actionEle.style, {
            width,
            height
        });
    }

    protected disposeActionEle(): void {

        if (this.actionEle) {
            if (this.dragType !== 'move-self') {
                this.actionEle.parentNode && this.actionEle.parentNode.removeChild(this.actionEle);
            }

            if (this.dragType !== 'copy') {
                const target = this.getTarget();

                if (target) {
                    target.style.cssText = this.startStyle || '';
                }
            }
        }

        this.actionEle = undefined;
    }

    protected cancelDrag(): void {
        this.dragging = false;
        this.disposeActionEle();
        this.startStyle = '';
        this.actionEle = undefined;
        this.startPos = undefined;
    }

    private calcTargetOffset(
        startPos: IDraggablePos,
        startMousePos: IMousePos,
        currentMousePos: IMousePos
    ): IOffset {

        const {direction, overflow, overflowBoundaries} = this;
        const {targetPos, containerPos} = startPos;

        let offset: IOffset = {x: 0, y: 0};
        let x = targetPos.left + (currentMousePos.pageX - startMousePos.pageX);
        let y = targetPos.top + (currentMousePos.pageY - startMousePos.pageY);

        if (!overflow) {

            y = Math.min(
                Math.max(containerPos.top + (overflowBoundaries.top || 0), y),
                containerPos.bottom - (overflowBoundaries.bottom || 0) - targetPos.height
            );

            x = Math.min(
                Math.max(containerPos.left + (overflowBoundaries.left || 0), x),
                containerPos.right - (overflowBoundaries.right || 0) - targetPos.width
            );
        }

        switch (direction) {
            case 'horizontal':
                offset.x = x;
                break;
            case 'vertical':
                offset.y = y;
                break;
            default:
                offset = {x, y};
                break;
        }

        return offset;
    }

    private init(): void {
        this.drag.addListener('drag-prepare', e => this.handleDragPrepare(e));
        this.drag.addListener('drag-start', e => this.handleDragStart(e));
        this.drag.addListener('dragging', e => this.handleDragging(e));
        this.drag.addListener('drag-end', e => this.handleDragEnd(e));
    }

    private abortScrollableTime(): void {

        if (this.scrollableTimeId) {

            clearTimeout(this.scrollableTimeId);

            this.scrollableTimeId = 0;

            if (this.isStartScroll) {
                this.isStartScroll = false;
                this.containerScrollAbort();
                this.emit('scroll-end');
            }
        }
    }

    private startScrollableTime(): void {

        this.scrollableTimeId = window.setTimeout(() => {

            this.abortScrollableTime();
            this.isStartScroll = true;
            this.containerScroll();

            this.emit('scroll-start', this.scrollDirection);
        }, this.scrollableDelay);
    }

    private containerScroll(): void {

        const [horizontalDir, verticalDir] = this.scrollDirection;

        this.scrollTimeId = window.setInterval(() => {

            const scrollTop = this.container?.scrollTop ?? 0;
            const scrollLeft = this.container?.scrollLeft ?? 0;

            let x = 0;
            let y = 0;

            if (horizontalDir != null) {
                x = (horizontalDir === 'left' ? -1 : 1) * this.scrollStep;
            }

            if (verticalDir != null) {
                y = (verticalDir === 'top' ? -1 : 1) * this.scrollStep;
            }

            this.container?.scrollTo({
                left: scrollLeft + x,
                top: scrollTop + y
            });

        }, 16.6);
    }

    private containerScrollAbort(): void {
        if (this.scrollTimeId) {
            clearInterval(this.scrollTimeId);
            this.scrollTimeId = 0;
        }
    }

    private detectScroll(e: IDragEvent<T>): IScrollDirection | null {

        const {currentMousePos: {pageX, pageY}} = e;
        const {
            direction,
            scrollable,
            scrollableBoundaries: {left = 10, top = 10, right = 10, bottom = 10},
            container
        } = this;

        if (!scrollable) {
            return null;
        }

        const containerPos = this.startPos && this.startPos.containerPos || Draggable.getOffsetPosition(container);
        let horizontalDir: IScrollHorizontalDirection | null = null;
        let verticalDir: IScrollVerticalDirection | null = null;

        if (pageY - containerPos.top <= top && pageY - containerPos.top >= 0) {
            verticalDir = 'top';
        } else if (containerPos.bottom - pageY <= bottom && containerPos.bottom - pageY >= 0) {
            verticalDir = 'bottom';
        }

        if (pageX - containerPos.left <= left && pageX - containerPos.left >= 0) {
            horizontalDir = 'left';
        } else if (containerPos.right - pageX <= right && containerPos.right - pageX >= 0) {
            horizontalDir = 'right';
        }

        switch (direction) {
            case 'horizontal':
                return horizontalDir == null ? null : [horizontalDir, null];
            case 'vertical':
                return verticalDir == null ? null : [null, verticalDir];
            default:
                return horizontalDir == null && verticalDir == null ? null : [horizontalDir, verticalDir];
        }
    }
}
