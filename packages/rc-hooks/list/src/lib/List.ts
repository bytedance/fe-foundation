/**
 * @file List 列表元素
 */

import {Emitter} from '@co-hooks/emitter';
import {IElementSize} from '@co-hooks/dom';
import {IListSizeGetter, IListSizeInfo, ListSizeManager} from './ListSizeManager';

export interface IListOptions {
    estimatedItemHeight: number;
    itemHeight: false | number | IListSizeGetter;
    itemCount: number;
}

export interface IListEvent {
    'scroller-need-update': [];
    'wrapper-need-update': [];
    'scroller-need-scroll': [number];
}

export class List extends Emitter<IListEvent> {

    private readonly offset: number = 0;

    private height: number = 0;

    private readonly manager: ListSizeManager = new ListSizeManager();


    // 更新组信息
    public updateListOptions(options: IListOptions): void {

        const needUpdate = this.manager.updateManagerInfo({
            size: options.itemHeight,
            count: options.itemCount,
            estimatedSize: options.estimatedItemHeight
        });

        if (needUpdate) {
            this.emit('scroller-need-update');
        }
    }

    public getRenderItemList(): IListSizeInfo[] {
        return this.manager.getVisibleRenderRange(this.offset, this.height);
    }

    public getWrapperSize(): IElementSize {
        return {
            width: 0,
            height: this.height
        };
    }

    //
    // public scrollTo(top?: number, left?: number): void {
    //
    // }
    //
    // public scrollToCell(col?: number, row?: number): void {
    //
    // }

    public updateWrapperSize(size: Partial<IElementSize>, isSilent = false): void {

        let needUpdate = false;

        if (size.height != null && size.height !== this.height) {
            this.height = size.height;
            needUpdate = true;
        }

        if (!isSilent && needUpdate) {
            this.emit('wrapper-need-update');
        }
    }

    public inScrolling(): boolean {
        return false;
    }

    public getScrollerSize(): IElementSize {
        return {
            width: 0,
            height: this.manager.getTotalSize()
        };
    }

    public updateItemSize(index: number, size: IElementSize): void {
        this.manager.updateItemSize(index, size.height);
    }
}
