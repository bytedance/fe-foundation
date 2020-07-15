/**
 * @file Sortable 可排序组件，支持多容器
 */

import {addClass, removeClass} from '@co-hooks/dom';
import {IDraggableEvent} from '@co-hooks/draggable';
import {Emitter} from '@co-hooks/emitter';
import {shallowMerge} from '@co-hooks/util';
import {IDragEvent, IMousePos} from '@co-hooks/drag';
import {ICalElemHitWidthMousePosResult, calElemHitWithMousePos} from '../util';

export type ISortableContainerMode = 'vertical' | 'horizontal';

export interface ISortableOptions<T> {
    containerIdentifierPropName?: string;
    elemIdentifierPropName?: string;
    hittingContainerClassName?: string;
    mode?: ISortableContainerMode;
    dragLimit?: number;
    isValidContainer?: (data: T, id: string) => boolean;
    isValidElement?: (data: T, id: string) => boolean;
    isVirtualDrag?: (data: T) => boolean;
    createPlaceHolder?: (id: string, index: number, e: IDraggableEvent<T>) => HTMLElement;
    getContainerMode?: (id: string) => null | ISortableContainerMode;
    getDragRoot?: (data: T) => HTMLElement | null;
}

const DEFAULT_OPTIONS: Required<ISortableOptions<unknown>> = {
    containerIdentifierPropName: 'data-container-id',
    elemIdentifierPropName: 'data-element-id',
    hittingContainerClassName: '',
    mode: 'vertical',
    dragLimit: 10,
    isValidContainer: () => true,
    isValidElement: () => true,
    isVirtualDrag: () => false,
    createPlaceHolder: () => document.createElement('placeholder'),
    getContainerMode: () => null,
    getDragRoot: () => document.body
};

export interface ISortablePosition {

    // 所属画板
    container: string;

    // 注意如果移动的元素在当前board里面，给的索引是删除当前元素以后的
    index: number;
}

export interface ISortableInfo<T> extends ISortablePosition {

    // 是否是移动产生的
    move: boolean;

    // 数据
    data: T;
}

interface HitContainerInfo extends ICalElemHitWidthMousePosResult {
    container: HTMLElement;
    containerId: string;
    mode: ISortableContainerMode;
}

export interface ISortableEvent<T> {
    change: [IDraggableEvent<T>, ISortableInfo<T> | null, ISortableInfo<T>];
    'drag-start': [IDraggableEvent<T>];
    'dragging': [IDraggableEvent<T>];
    'drag-end': [IDraggableEvent<T>];
    'drag-cancel': [];
}

export class Sortable<T> extends Emitter<ISortableEvent<T>> {

    private isDragging: boolean = false;
    private target: HTMLElement | null = null;
    private root: HTMLElement | null = null;
    private placeholder: HTMLElement | null = null;
    private dragLimit: number = DEFAULT_OPTIONS.dragLimit;
    private containerIdentifierPropName: string = DEFAULT_OPTIONS.containerIdentifierPropName;
    private elemIdentifierPropName: string = DEFAULT_OPTIONS.elemIdentifierPropName;
    private isVirtualDrag: (data: T) => boolean = DEFAULT_OPTIONS.isVirtualDrag;
    private isValidContainer: (data: T, id: string) => boolean = DEFAULT_OPTIONS.isValidContainer;
    private isValidElement: (data: T, id: string) => boolean = DEFAULT_OPTIONS.isValidElement;
    private createPlaceHolder: (
        id: string, index: number, e: IDraggableEvent<T>
    ) => HTMLElement = DEFAULT_OPTIONS.createPlaceHolder;
    private getContainerMode: (id: string) => null | ISortableContainerMode = DEFAULT_OPTIONS.getContainerMode;
    private mode: ISortableContainerMode = DEFAULT_OPTIONS.mode;
    private getDragRoot: (data: T) => HTMLElement | null = DEFAULT_OPTIONS.getDragRoot;
    private virtual: boolean = false;
    private lastHitContainer: HTMLElement | null = null;
    private hittingContainerClassName: string = DEFAULT_OPTIONS.hittingContainerClassName;

    public ensureDragRoot(e: IDragEvent<T>): HTMLElement | null {

        if (e.data == null) {
            return null;
        }

        return this.root = this.getDragRoot(e.data);
    }

    public resetDragRoot(): void {
        this.root = null;
    }

    public getDragLimit(): number {
        return this.dragLimit;
    }

    public updateOptions(options: ISortableOptions<T>): void {

        const merged = shallowMerge(DEFAULT_OPTIONS as Required<ISortableOptions<T>>, options);

        this.containerIdentifierPropName = merged.containerIdentifierPropName;
        this.elemIdentifierPropName = merged.elemIdentifierPropName;
        this.mode = merged.mode;
        this.isValidContainer = merged.isValidContainer;
        this.createPlaceHolder = merged.createPlaceHolder;
        this.isValidElement = merged.isValidElement;
        this.dragLimit = merged.dragLimit;
        this.getContainerMode = merged.getContainerMode;
        this.getDragRoot = merged.getDragRoot;
        this.isVirtualDrag = merged.isVirtualDrag;
        this.hittingContainerClassName = merged.hittingContainerClassName;
    }

    public dragStart(e: IDraggableEvent<T>): void {

        const {data, target} = e;

        if (data == null) {
            return;
        }

        this.target = target;
        this.isDragging = true;
        this.virtual = this.isVirtualDrag(data);
        this.emit('drag-start', e);
    }

    public dragging(e: IDraggableEvent<T>): void {

        const {data, target} = e;

        if (data == null || !this.isDragging) {
            return;
        }

        if (target !== this.target) {
            // 或者换了对象
            this.resetDragInfo();
            return;
        }

        if (!this.virtual) {
            // 计算placeholder位置并插入
            this.ensurePlaceHolderPosition(e);
        }

        // 走到这地方不触发任何拖拽
        this.emit('dragging', e);
    }

    public dragEnd(e: IDraggableEvent<T>): void {

        const {data, target} = e;

        // 换了对象，等不合法的拖拽
        if (!data || this.target !== target || !this.isDragging || (!this.virtual && this.placeholder == null)) {
            this.resetDragInfo();
            return;
        }

        // 虚拟拖拽的情况下，不需要做碰撞检测
        if (this.virtual) {
            this.resetDragInfo(e);
            return;
        }

        const to = this.getElementIndex(data, this.placeholder);
        const from = this.getElementIndex(data, target);


        if (to == null) {
            this.resetDragInfo();
            return;
        }

        this.resetDragInfo(e);

        const fromEvent: ISortableInfo<T> | null = from
            ? {
                move: true,
                data,
                ...from
            }
            : null;

        const toEvent: ISortableInfo<T> = {
            move: from != null,
            data,
            ...to
        };

        this.emit('change', e, fromEvent, toEvent);
    }

    public dispose(): void {
        this.removePlaceholder();
    }

    // 确定获取PlaceHolder
    private ensurePlaceHolder(container: HTMLElement, id: string, index: number, e: IDraggableEvent<T>): HTMLElement {
        this.removePlaceholder(container);
        return this.placeholder = this.createPlaceHolder(id, index, e);
    }

    // 删除了Placeholder
    private removePlaceholder(container?: HTMLElement): void {

        if (this.lastHitContainer != null && this.hittingContainerClassName && container !== this.lastHitContainer) {
            removeClass(this.lastHitContainer, this.hittingContainerClassName);
        }

        this.lastHitContainer = null;

        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }

        this.placeholder = null;
    }

    // 计算碰撞上的容器
    private getHitContainer(data: T, target: HTMLElement, currentMousePos: IMousePos): HitContainerInfo | null {

        const {root, isValidContainer, containerIdentifierPropName} = this;

        if (root == null) {
            return null;
        }

        let allElem: HTMLElement[] = [].slice.call(root.querySelectorAll(`[${containerIdentifierPropName}]`));

        allElem.push(root);

        allElem = allElem.filter((elem: HTMLElement) => {

            const id = elem.getAttribute(containerIdentifierPropName);

            if (id == null) {
                return false;
            }

            if (!isValidContainer(data, id)) {
                return false;
            }

            // 元素不能和当前元素相同，也不能在当前元素内部，也不能是placeholder
            return elem !== target && !target.contains(elem) && elem !== this.placeholder;
        });

        allElem.sort((a, b) => {

            const code = a.compareDocumentPosition(b);

            // 8 -> b包含a  16 -> a包含b  4 -> b在a之后  2 -> b在a之前
            return code & 8 ? -1 : code & 16 ? 1 : code & 4 ? -1 : code & 2 ? 1 : 0;
        });

        for (const container of allElem) {

            const hitResult = calElemHitWithMousePos(container, currentMousePos);

            if (!hitResult) {
                continue;
            }

            const containerId: string = container.getAttribute(this.containerIdentifierPropName) as string;
            const mode = this.getRealContainerMode(containerId);

            // 对于非root元素，预留10px左右的安全边界
            if (container !== root) {

                if (mode === 'vertical'
                    && (
                        hitResult.vertical === 'top' && hitResult.offsetTop <= 10
                        || hitResult.vertical === 'bottom' && hitResult.offsetBottom <= 10
                    )
                ) {
                    continue;
                }

                if (mode === 'horizontal'
                    && (
                        hitResult.horizontal === 'left' && hitResult.offsetLeft <= 10
                        || hitResult.horizontal === 'right' && hitResult.offsetRight <= 10
                    )
                ) {
                    continue;
                }
            }

            return {
                container,
                containerId,
                mode,
                ...hitResult
            };
        }

        return null;
    }

    // 确定PlaceHolder的位置
    private ensurePlaceHolderPosition(e: IDraggableEvent<T>): void {

        if (!this.isDragging) {
            return;
        }

        const {data, target, currentMousePos} = e;

        if (!data) {
            return;
        }

        if (this.placeholder && calElemHitWithMousePos(this.placeholder, currentMousePos)) {
            return;
        }

        const result = this.getHitContainer(data, target, currentMousePos);

        if (!result) {
            this.removePlaceholder();
            return;
        }
        const {container, containerId, mode} = result;

        if (this.hittingContainerClassName) {
            addClass(container, this.hittingContainerClassName);
        }

        let child = container.firstElementChild;
        let index = 0;
        let first: HTMLElement | null = null;

        while (child) {

            if (child === target || child === this.placeholder) {
                child = child.nextElementSibling;
                continue;
            }

            const id = child.getAttribute(this.elemIdentifierPropName);

            if (id == null || !this.isValidElement(data, id)) {
                child = child.nextElementSibling;
                continue;
            }

            if (first == null) {
                first = child as HTMLElement;
            }

            const hitResult = calElemHitWithMousePos(child as HTMLElement, currentMousePos);

            if (hitResult) {

                const {vertical, horizontal} = hitResult;

                if (mode === 'vertical' && vertical === 'top'
                    || mode === 'horizontal' && horizontal === 'left'
                ) {
                    container.insertBefore(this.ensurePlaceHolder(container, containerId, index, e), child);
                } else {
                    container.insertBefore(this.ensurePlaceHolder(container, containerId, index, e), child.nextSibling);
                }
                this.lastHitContainer = container;
                return;
            }

            child = child.nextElementSibling;
            index++;
        }

        container.appendChild(this.ensurePlaceHolder(container, containerId, index, e));
        this.lastHitContainer = container;
    }

    // 从元素上获取坐标
    private getElementIndex(data: T, element?: HTMLElement | null): ISortablePosition | null {

        if (!element) {
            return null;
        }

        let index = 0;
        const parent = element.parentNode;

        if (!parent) {
            return null;
        }

        const container = (parent as HTMLElement).getAttribute(this.containerIdentifierPropName);

        if (!container) {
            return null;
        }

        for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {

            if (child === element) {
                break;
            }

            const id = child.getAttribute(this.elemIdentifierPropName);

            if (id == null || !this.isValidElement(data, id)) {
                continue;
            }

            // 避免当前元素的影响
            if (child !== this.target) {
                index++;
            }
        }

        return {
            container,
            index
        };
    }

    // 取消了拖拽
    private resetDragInfo(e?: IDraggableEvent<T>): void {
        this.virtual = false;
        this.isDragging = false;
        this.target = null;
        this.resetDragRoot();
        this.removePlaceholder();

        if (e == null) {
            this.emit('drag-cancel');
            return;
        }

        this.emit('drag-end', e);
    }

    private getRealContainerMode(id: string): ISortableContainerMode {
        const mode = this.getContainerMode(id);
        return mode == null ? this.mode : mode;
    }
}
