/**
 * @file Sorter
 */

import {Emitter} from '@co-hooks/emitter';
import {ISortableContainerMode, ISortableInfo} from '@co-hooks/sortable';
import {Container, ISorterDragData} from './Container';

export interface ISorterEvents {
    'dragging-change': [boolean];
}

export class Sorter<T, E> extends Emitter<ISorterEvents> {

    // 拖拽中状态
    private dragging: boolean = false;

    // 拖拽中的数据
    private draggingData: ISorterDragData<T, E> | null = null;

    private containers: Record<string, Container<T, E>> = {};

    constructor() {
        super();
    }

    public register(name: string, container: Container<T, E>): void {
        this.containers[name] = container;
    }

    public unregister(name: string): void {
        delete this.containers[name];
    }

    public setSorter(from: ISortableInfo<ISorterDragData<T, E>> | null, to: ISortableInfo<ISorterDragData<T, E>>): void {

        if (from != null) {

            const container = this.containers[from.container];

            if (container == null) {
                throw new Error('invalid container name = ' + from.container);
            }

            if (from.container === to.container) {
                container.sortElement(from.index, to.index, to.data);
                return;
            }

            container.removeElement(from.index);
        }

        const container = this.containers[to.container];

        if (container == null) {
            throw new Error('invalid container name = ' + to.container);
        }

        container.addElement(to.data, to.index);
    }

    public setDragging(dragging: boolean, draggingData: ISorterDragData<T, E> | null = null): void {

        if (dragging !== this.dragging) {

            this.dragging = dragging;
            this.draggingData = draggingData;
            this.emit('dragging-change', dragging);

            Object.keys(this.containers).forEach(key => {

                const container = this.containers[key];

                if (container != null) {
                    container.emit('dragging-change', dragging);
                }
            });
        }
    }

    public isValidContainer(data: ISorterDragData<T, E>, target: string): boolean {

        const container = this.containers[target];

        if (container == null) {
            throw new Error('invalid container name = ' + target);
        }

        return container.isValidContainer(data);
    }

    public getContainerMode(target: string): ISortableContainerMode {

        const container = this.containers[target];

        if (container == null) {
            throw new Error('invalid container name = ' + target);
        }

        return container.getContainerMode();
    }
}
