/**
 * @file Drag 拖拽核心类型
 */

import {Emitter} from '@co-hooks/emitter';
import {closest, isClient} from '@co-hooks/dom';

export type IsBoolean = () => boolean;

export interface IDrag<T> {
    draggable?: boolean | IsBoolean;
    trigger?: string;
    data?: T;
    dragLimit?: number;
}

export interface IDragEvent<T> {
    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    startMousePos: IMousePos;
    latestMousePos: IMousePos;
    currentMousePos: IMousePos;
    target: HTMLElement;
    data?: T;
}

export interface IMousePos {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
}

export function getDefaultMousePos(): IMousePos {
    return {
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0
    };
}

const ALL_DRAG_ELEMENTS: IDragInterface[] = [];

// 当前激活的拖拽元素
let currentDragElement: IDragInterface | null = null;

if (isClient()) {
    // 当前有激活元素时，屏蔽select、touch、click事件
    document.addEventListener('selectstart', e => {
        if (currentDragElement) {
            e.preventDefault();
        }
    }, false);

    document.addEventListener('touchstart', e => {
        if (currentDragElement) {
            e.preventDefault();
        }
    }, false);

    document.addEventListener('dragstart', e => {
        if (currentDragElement) {
            e.preventDefault();
        }
    }, false);

    document.addEventListener('click', e => {
        if (currentDragElement) {
            e.preventDefault();
        }
    }, false);

    document.addEventListener('mousemove', e => {
        if (currentDragElement) {
            currentDragElement.handleEvent(e);
        }
    }, false);

    document.addEventListener('mouseup', e => {
        if (currentDragElement) {
            currentDragElement.handleEvent(e);
        }
    }, false);
}

export interface IDragEventType<T> {
    'drag-prepare': [IDragEvent<T>];
    'drag-start': [IDragEvent<T>];
    'dragging': [IDragEvent<T>];
    'drag-end': [IDragEvent<T>];
    'click': [IDragEvent<T>];
}

export interface IDragInterface extends EventListenerObject {
    prepareDrag: (e: MouseEvent) => void;
    handleDragStart: (e: MouseEvent) => void;
    handleDragging: (e: MouseEvent) => void;
    handleDragEnd: (e: MouseEvent) => void;
    handleClick: (e: MouseEvent) => void;
}

export class Drag<T = null> extends Emitter<IDragEventType<T>> implements IDragInterface {

    private elem: HTMLElement | null = null;

    private draggable: IsBoolean;

    private dragLimit: number = 0;

    private trigger: string = '';

    private data?: T;

    private firstFlag: boolean = false;

    private startMousePos: IMousePos = getDefaultMousePos();

    private latestMousePos: IMousePos = getDefaultMousePos();

    constructor() {
        super();
        this.draggable = () => true;
        ALL_DRAG_ELEMENTS.push(this);
    }

    public dispose(): void {
        if (this === currentDragElement) {
            currentDragElement = null;

            this.handleDragEnd(this.latestMousePos as MouseEvent);

        }
        const ele = this.getElem();

        ele && this.unbindEvent(ele);

        const index = ALL_DRAG_ELEMENTS.indexOf(this);

        if (index >= 0) {
            ALL_DRAG_ELEMENTS.splice(index, 1);
        }
    }

    public init(ele: HTMLElement): void {

        const originELe = this.getElem();

        if (ele !== this.getElem()) {
            originELe && this.unbindEvent(originELe);
            this.bindEvent(ele);
            this.elem = ele;
        }
    }

    public updateOptions(options: IDrag<T>): void {

        const {draggable = true, trigger = '', data, dragLimit = 0} = options;

        this.draggable = typeof draggable === 'function' ? draggable : () => draggable;
        this.trigger = trigger;
        this.data = data;
        this.dragLimit = dragLimit;
    }

    public getElem(): HTMLElement | null {
        return this.elem;
    }

    public handleEvent(e: MouseEvent): void {
        switch (e.type) {
            case 'mousedown':
                this.prepareDrag(e);
                break;
            case 'mousemove':
                this.handleDragging(e);
                break;
            case 'mouseup':
                this.handleDragEnd(e);
                break;
            case 'click':
                this.handleClick(e);
                break;
        }
    }

    public prepareDrag(e: MouseEvent): void {

        e.stopPropagation();

        const {trigger, draggable, data} = this;

        if (!draggable() || (trigger && !closest(e.target as HTMLElement, trigger, this.getElem()))) {
            return;
        }

        if (currentDragElement) {
            currentDragElement.handleDragEnd(e);
        }

        currentDragElement = this;

        this.firstFlag = true;

        const {shiftKey, ctrlKey, metaKey, altKey, clientX, clientY, pageX, pageY} = e;

        const startMousePos = this.startMousePos = {clientX, clientY, pageX, pageY};

        this.emit('drag-prepare', {
            shiftKey,
            ctrlKey,
            metaKey,
            altKey,
            startMousePos,
            currentMousePos: startMousePos,
            latestMousePos: startMousePos,
            data,
            target: this.getDragElem()
        });
    }

    public handleDragStart(e: MouseEvent): void {

        this.firstFlag = false;

        const {data, startMousePos} = this;

        const {shiftKey, ctrlKey, altKey, metaKey} = e;

        this.emit('drag-start', {
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            startMousePos,
            currentMousePos: startMousePos,
            latestMousePos: startMousePos,
            data,
            target: this.getDragElem()
        });

        this.latestMousePos = startMousePos;
    }

    public handleDragging(e: MouseEvent): void {

        e.stopPropagation();


        const {clientX, clientY, pageX, pageY, shiftKey, ctrlKey, altKey, metaKey} = e;

        const {startMousePos, latestMousePos, data} = this;
        const currentMousePos = {clientX, clientY, pageX, pageY};

        if (this.firstFlag) {

            if (
                Math.max(
                    Math.abs(startMousePos.clientX - clientX),
                    Math.abs(startMousePos.clientY - clientY)
                ) <= this.dragLimit
            ) {
                return;
            }

            this.handleDragStart(e);
        }

        this.emit('dragging', {
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            startMousePos,
            latestMousePos,
            currentMousePos,
            data,
            target: this.getDragElem()
        });

        this.latestMousePos = currentMousePos;
    }

    public handleDragEnd(e: MouseEvent): void {

        e.stopPropagation();
        currentDragElement = null;

        if (this.firstFlag) {
            this.firstFlag = false;
            return;
        }

        const {clientX, clientY, pageX, pageY, shiftKey, ctrlKey, altKey, metaKey} = e;
        const {startMousePos, latestMousePos, data} = this;

        const currentMousePos = {clientX, clientY, pageX, pageY};

        this.emit('drag-end', {
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            startMousePos,
            currentMousePos,
            latestMousePos,
            data,
            target: this.getDragElem()
        });

        this.latestMousePos = getDefaultMousePos();
        this.startMousePos = getDefaultMousePos();
        this.firstFlag = false;
    }

    public handleClick(e: MouseEvent): void {

        currentDragElement = null;

        const {clientX, clientY, pageX, pageY, shiftKey, ctrlKey, altKey, metaKey} = e;
        const {startMousePos, latestMousePos, data} = this;

        const currentMousePos = {clientX, clientY, pageX, pageY};

        this.emit('click', {
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            startMousePos,
            currentMousePos,
            latestMousePos,
            data,
            target: this.getDragElem()
        });
    }

    private bindEvent(ele: HTMLElement): void {
        ele.addEventListener('mousedown', this, false);
        ele.addEventListener('click', this, false);
    }

    private unbindEvent(ele: HTMLElement): void {
        ele.removeEventListener('mousedown', this, false);
        ele.removeEventListener('click', this, false);
    }

    private getDragElem(): HTMLElement {

        if (this.elem == null) {
            throw new Error('call init method first');
        }

        return this.elem;
    }
}
