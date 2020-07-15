/**
 * @file DragMask
 */
import {
    IElementPosition,
    getDefaultElementPosition,
    getElementPosition,
    isElementPositionContains,
    isElementPositionCross,
    isElementPositionEqual
} from '@co-hooks/dom';
import {IDragEvent, IMousePos, getDefaultMousePos} from '@co-hooks/drag';
import {Emitter} from '@co-hooks/emitter';

export type IDragMaskRelativePosition = IElementPosition;

export interface IDragMaskEvent<T> extends IDragEvent<T> {
    rect: IDragMaskRelativePosition;
    clientRect: IElementPosition;
    selected: string[];
    negative: boolean;
    dragging: boolean;
}

export interface IDragMaskEventHandler<T> {
    start: [IDragMaskEvent<T>];
    change: [IDragMaskEvent<T>];
    end: [IDragMaskEvent<T>];
}

export type IDragMaskFuncKey = 'alt' | 'meta' | 'shift' | 'ctrl';

type IDragMaskFuncKeyField = 'altKey' | 'metaKey' | 'shiftKey' | 'ctrlKey';

export interface IDragMaskOptions {
    overflow?: boolean;
    selectable?: boolean;
    draggingSelectable?: boolean;
    selectType?: 'cover' | 'cross';
    negativeKeys?: IDragMaskFuncKey[];
    domKey?: string;
}

const KEY_FIELD_MAP: Record<IDragMaskFuncKey, IDragMaskFuncKeyField> = {
    alt: 'altKey',
    meta: 'metaKey',
    shift: 'shiftKey',
    ctrl: 'ctrlKey'
};

export class DragMask<T> extends Emitter<IDragMaskEventHandler<T>> {

    private boxRect: IElementPosition = getDefaultElementPosition();

    private startPos: IMousePos = getDefaultMousePos();

    private endPos: IMousePos = getDefaultMousePos();

    private dragging: boolean = false;

    private maskRelativeRect: IElementPosition = getDefaultElementPosition();

    private maskClientRect: IElementPosition = getDefaultElementPosition();

    private overflow: boolean = false;

    private selectable: boolean = false;

    private draggingSelectable: boolean = false;

    private selectType: string = 'cover';

    private domKey: string = 'data-mask-key';

    private container: HTMLElement | null = null;

    private negativeKeys: IDragMaskFuncKey[] = ['meta'];

    public updateOptions(options: IDragMaskOptions): void {

        const {
            overflow = false,
            selectable = false,
            draggingSelectable = false,
            selectType = 'cover',
            domKey = 'data-mask-key',
            negativeKeys
        } = options;

        this.overflow = overflow;
        this.selectable = selectable;
        this.draggingSelectable = draggingSelectable;
        this.selectType = selectType;
        this.domKey = domKey;
        this.negativeKeys = negativeKeys || ['meta'];
    }

    public updateContainer(container: HTMLElement | null): void {
        this.container = container;
    }

    public updateBoxRect(rect: IElementPosition): void {
        this.boxRect = rect;
    }

    public updateStartPos(e: IDragEvent<T>): void {
        this.dragging = true;
        this.startPos = e.startMousePos;
        this.endPos = e.startMousePos;
        this.emitEvent('start', e);
    }

    public updateEndPos(e: IDragEvent<T>): void {

        this.endPos = e.currentMousePos;

        if (this.dragging) {
            this.emitEvent('change', e);
        }
    }

    public stopDrag(e: IDragEvent<T>): void {
        this.dragging = false;
        this.endPos = e.currentMousePos;
        this.emitEvent('change', e);
        this.emitEvent('end', e);
        this.startPos = getDefaultMousePos();
        this.endPos = getDefaultMousePos();
    }

    public isDragging(): boolean {
        return this.dragging;
    }

    public getRelativeRect(): IElementPosition {

        const rect = this.calcMaskRect();

        if (isElementPositionEqual(rect, this.maskRelativeRect)) {
            return this.maskRelativeRect;
        }

        return this.maskRelativeRect = rect;
    }

    public getMaskClientRect(): IElementPosition {

        const rect = this.calcRegionRect();

        if (isElementPositionEqual(rect, this.maskClientRect)) {
            return this.maskClientRect;
        }

        return this.maskClientRect = rect;
    }

    private calcMaskRect(): IElementPosition {

        const {
            left: boxLeft,
            top: boxTop,
            right: boxRight,
            bottom: boxBottom,
            width: boxWidth,
            height: boxHeight
        } = this.boxRect;

        const {
            left: regionLeft,
            top: regionTop,
            right: regionRight,
            bottom: regionBottom
        } = this.calcRegionRect();

        const {overflow} = this;

        const left = overflow ? regionLeft - boxLeft : Math.max(regionLeft - boxLeft, 0);
        const top = overflow ? regionTop - boxTop : Math.max(regionTop - boxTop, 0);
        const right = overflow ? boxRight - regionRight : Math.max(boxRight - regionRight, 0);
        const bottom = overflow ? boxBottom - regionBottom : Math.max(boxBottom - regionBottom, 0);

        return {
            left,
            top,
            right,
            bottom,
            width: boxWidth - left - right,
            height: boxHeight - top - bottom
        };
    }

    private calcRegionRect(): IElementPosition {

        const {clientX: startClientX, clientY: startClientY} = this.startPos;
        const {clientX: endClientX, clientY: endClientY} = this.endPos;

        const left = Math.min(startClientX, endClientX);
        const top = Math.min(startClientY, endClientY);
        const width = Math.abs(startClientX - endClientX);
        const height = Math.abs(startClientY - endClientY);

        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height
        };
    }

    private emitEvent(type: keyof IDragMaskEventHandler<T>, e: IDragEvent<T>): void {

        const {draggingSelectable, selectable} = this;
        const negative = this.negativeKeys.every(key => e[KEY_FIELD_MAP[key]]);

        this.emit(type, {
            ...e,
            dragging: this.dragging,
            rect: this.getRelativeRect(),
            clientRect: this.getMaskClientRect(),
            negative,
            selected: type === 'change' && draggingSelectable || type === 'end' && selectable
                ? this.getSelectedKeys()
                : []
        });
    }

    private getSelectedKeys(): string[] {

        const {container, domKey, selectType} = this;
        const client = this.getMaskClientRect();

        if (container == null) {
            return [];
        }

        const elemList: HTMLElement[] = [].slice.call(container.querySelectorAll('[' + domKey + ']'));
        const keys: Record<string, boolean> = {};

        elemList.forEach(elem => {

            const key = elem.getAttribute(domKey);

            if (key == null) {
                return;
            }

            if (selectType === 'cover'
                ? isElementPositionContains(client, getElementPosition(elem))
                : isElementPositionCross(client, getElementPosition(elem))
            ) {
                keys[key] = true;
            }
        });

        return Object.keys(keys);
    }
}
