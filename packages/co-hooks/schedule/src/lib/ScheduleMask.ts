/**
 * @file ScheduleMask
 */
import {IElementPosition, IElementSize, getDefaultElementPosition, getDefaultElementSize} from '@co-hooks/dom';
import {IMousePos, getDefaultMousePos} from '@co-hooks/drag';
import {Emitter} from '@co-hooks/emitter';
import {IScheduleValue, Schedule} from './Schedule';

export interface IScheduleMaskEvent {
    repaint: [];
}

export interface IScheduleMaskRelativeRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export class ScheduleMask extends Emitter<IScheduleMaskEvent> {

    private readonly root: Schedule;

    private boxRect: IElementPosition = getDefaultElementPosition();

    private startPos: IMousePos = getDefaultMousePos();

    private endPos: IMousePos = getDefaultMousePos();

    private colSize: IElementSize = getDefaultElementSize();

    private dragging: boolean = false;

    private maskRelativeRect: IScheduleMaskRelativeRect | null = null;

    constructor(root: Schedule) {
        super();
        this.root = root;
    }

    public updateBoxRect(rect: IElementPosition): void {
        this.boxRect = rect;
        this.updateColSize();
    }

    public updateColSize(): void {
        const divider = this.root.getDivider();
        const datasource = this.root.getDatasource();

        const rowNum = datasource.length;
        const colNum = divider * 24;
        const {width, height} = this.boxRect;

        if (!rowNum) {
            this.colSize = getDefaultElementSize();
            return;
        }

        this.colSize = {
            width: width / colNum | 0,
            height: height / rowNum | 0
        };

        this.emit('repaint');
    }

    public getColSize(): IElementSize {
        return this.colSize;
    }

    public updateStartPos(pos: IMousePos): void {
        if (this.root.getDisabled()) {
            this.dragging = false;
            return;
        }

        this.dragging = true;
        this.startPos = pos;
    }

    public updateEndPos(pos: IMousePos): void {
        if (this.root.getDisabled()) {
            this.dragging = false;
            return;
        }

        this.endPos = pos;
        this.calcMaskRect();
        this.emit('repaint');
    }

    public stopDrag(endPos: IMousePos): void {
        this.dragging = false;
        if (this.root.getDisabled()) {
            return;
        }

        this.endPos = endPos;

        // 不在box内，取消选中
        if (endPos.clientX < this.boxRect.left
            || endPos.clientX > this.boxRect.right
            || endPos.clientY < this.boxRect.top
            || endPos.clientY > this.boxRect.bottom
        ) {
            this.emit('repaint');
            return;
        }

        this.calcMaskRect();
        this.calcRegionValue();
    }

    public getDragging(): boolean {
        return this.dragging;
    }

    public getMaskRelativeRect(): IScheduleMaskRelativeRect | null {
        return this.maskRelativeRect;
    }

    private calcMaskRect(): void {
        const {left: boxLeft, top: boxTop, right: boxRight, bottom: boxBottom} = this.boxRect;
        const {left: regionLeft, top: regionTop, right: regionRight, bottom: regionBottom} = this.calcRegionRect();
        const {width, height} = this.colSize;

        if (!width || !height) {
            this.maskRelativeRect = null;
            return;
        }

        const left = Math.max(regionLeft - boxLeft, 0);
        const top = Math.max(regionTop - boxTop, 0);
        const right = Math.max(boxRight - regionRight, 0);
        const bottom = Math.max(boxBottom - regionBottom, 0);

        this.maskRelativeRect = {
            left: left - left % width,
            top: top - top % height,
            right: right - right % width,
            bottom: bottom - bottom % height
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

    private calcRegionValue(): void {
        const datasource = this.root.getDatasource();
        const len = datasource.length;
        const rowNum = this.root.getDivider() * 24;
        const {width, height} = this.colSize;

        if (!width || !height || !len || !this.maskRelativeRect) {
            return;
        }

        const {left: maskLeft, top: maskTop, right: maskRight, bottom: maskBottom} = this.maskRelativeRect;
        const value: IScheduleValue[] = [];

        const topOffset = Math.round(maskTop / height);
        const bottomOffset = Math.round(maskBottom / height);
        const leftOffset = Math.round(maskLeft / width);
        const rightOffset = Math.round(maskRight / width);

        for (let i = topOffset; i < len - bottomOffset; i++) {
            const label = datasource[i];
            const val: number[] = [];

            for (let j = leftOffset; j < rowNum - rightOffset; j++) {
                val.push(j);
            }

            value.push({label, value: val});
        }

        this.root.setValue(value);
    }
}
