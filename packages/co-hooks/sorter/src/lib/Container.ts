/**
 * @file Container 拖拽容器
 */

import {Emitter} from '@co-hooks/emitter';
import {ISortableContainerMode} from '@co-hooks/sortable';
import {Sorter} from './Sorter';

export interface ISorterDragCreateData<T> {
    type: 'create';
    data: T;
}

export interface ISorterDragMoveData<E> {
    type: 'move';
    data: E;
}

export type ISorterDragData<T, E> = ISorterDragMoveData<E> | ISorterDragCreateData<T>;

export interface ISorterContainerOptions<T, E> {
    convertData: (data: T) => E;
    isValidContainer: (data: ISorterDragData<T, E>) => boolean;
    mode?: ISortableContainerMode;
    data: E[];
}

export interface ISorterContainerEvents<E> {
    change: [E[]];
    'dragging-change': [boolean];
}

export class Container<T, E> extends Emitter<ISorterContainerEvents<E>> {

    private convertData?: (data: T) => E;

    private validator?: (data: ISorterDragData<T, E>) => boolean;

    private data: E[] = [];

    private mode?: ISortableContainerMode;

    private readonly name: string;

    private readonly sorter: Sorter<T, E>;

    constructor(name: string, sorter: Sorter<T, E>) {
        super();
        this.sorter = sorter;
        this.name = name;
        sorter.register(name, this);
    }

    public updateOptions(options: ISorterContainerOptions<T, E>): void {
        this.data = options.data;
        this.convertData = options.convertData;
        this.validator = options.isValidContainer;
        this.mode = options.mode || 'horizontal';
    }

    public dispose(): void {
        this.sorter.unregister(this.name);
    }

    public removeElement(index: number, isSilent: boolean = false): void {

        const list = this.data.slice();

        list.splice(index, 1);

        if (!isSilent) {
            this.emit('change', list);
        }
    }

    public sortElement(from: number, to: number, info: ISorterDragData<T, E>, isSilent: boolean = false): void {

        if (!this.convertData) {
            throw new Error('call updateOptions First');
        }

        const list = this.data.slice();

        list.splice(from, 1);

        list.splice(to, 0, info.type === 'create' ? this.convertData(info.data) : info.data);

        if (!isSilent) {
            this.emit('change', list);
        }
    }

    public addElement(info: ISorterDragData<T, E>, index: number, isSilent: boolean = false): void {

        if (!this.convertData) {
            throw new Error('call updateOptions First');
        }

        const list = this.data.slice();

        list.splice(index, 0, info.type === 'create' ? this.convertData(info.data) : info.data);

        if (!isSilent) {
            this.emit('change', list);
        }
    }

    public setContainerData(data: E[]): void {
        this.data = data;
    }

    public getContainerData(): E[] {
        return this.data;
    }

    public isValidContainer(data: ISorterDragData<T, E>): boolean {

        if (!this.validator) {
            throw new Error('call updateOptions First');
        }

        return this.validator(data);
    }

    public getContainerMode(): ISortableContainerMode {

        if (this.mode == null) {
            throw new Error('call updateOptions First');
        }

        return this.mode;
    }

}
