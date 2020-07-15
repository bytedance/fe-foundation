/**
 * @file ListSizeManager 大小控制器
 */

export type IListSizeGetter = (index: number) => number | false;

export interface IListSizeManagerOptions {
    estimatedSize: number;
    size: false | number | IListSizeGetter;
    count: number;
}

export interface IListSizeInfo {
    index: number;
    dynamic: boolean;
    measured: boolean;
    size: number;
    offset: number;
}

export class ListSizeManager {

    // 模拟大小
    private estimatedSize: number = 0;

    // 大小获取器
    private size: false | number | IListSizeGetter = false;

    // 子项目数量
    private count: number = 0;

    // 单索引缓存
    private cache: {[key: number]: IListSizeInfo} = {};

    // 最后处理的元素大小
    private lastMeasuredIndex: number = -1;

    // 更新配置信息
    public updateManagerInfo(info: IListSizeManagerOptions): boolean {

        const {size, estimatedSize, count} = info;
        const needReset = this.size !== size;
        const needResetCount = count <= this.lastMeasuredIndex;

        this.size = size;

        // reset的话，直接清空，比较省内存
        if (needReset) {
            this.lastMeasuredIndex = -1;
            this.cache = {};
            this.estimatedSize = estimatedSize;
            this.count = count;
            return true;
        }

        // 重置最后一个元素
        this.lastMeasuredIndex = Math.min(count, this.lastMeasuredIndex);

        const needResetDynamic = estimatedSize !== this.estimatedSize;

        if (!needResetDynamic) {
            return needResetCount;
        }

        const delta = estimatedSize - this.estimatedSize;

        this.estimatedSize = estimatedSize;
        return this.resetDynamic(delta);
    }

    // 更新单项的大小
    public updateItemSize(index: number, size: number): boolean {

        const info = this.getItemSizeInfo(index);

        if (info.size === size) {
            info.measured = true;
            return false;
        }
        const delta = size - info.size;

        info.size = size;

        for (let i = index + 1; i <= this.lastMeasuredIndex; i++) {
            this.getItemSizeInfo(index).offset += delta;
        }

        return true;
    }

    // 获取可显示的
    public getVisibleRenderRange(offset: number, visibleSize: number): IListSizeInfo[] {

        const totalSize = this.getTotalSize();

        if (totalSize === 0) {
            return [];
        }

        const maxOffset = offset + visibleSize;
        const start = this.getNearestIndexOfOffset(offset);
        const startInfo = this.getItemSizeInfo(start);
        const result: IListSizeInfo[] = [startInfo];

        offset = startInfo.offset + startInfo.size;

        let end = start;

        while (offset < maxOffset && end < this.count - 1) {
            end++;
            result.push(this.getItemSizeInfo(end));
            offset += this.getItemSizeInfo(end).size;
        }

        return result;
    }

    // 获取预估总大小
    public getTotalSize(): number {

        const restCount = this.count - this.lastMeasuredIndex - 1;
        const {offset, size} = this.getLastMeasuredItemSizeInfo();

        return offset + size + restCount * this.estimatedSize;
    }

    // 获取某个Item的大小、位置和是否动态
    private getLastMeasuredItemSizeInfo(): IListSizeInfo {
        return this.lastMeasuredIndex < 0
            ? {offset: 0, size: 0, dynamic: false, index: -1, measured: true}
            : this.cache[this.lastMeasuredIndex];
    }

    // 获取某个Item的大小、位置和是否动态
    private getItemSizeInfo(index: number): IListSizeInfo {

        if (index < 0 || index >= this.count) {
            throw Error('Out of range, index should be in range [0, ' + this.count + ')');
        }

        if (index > this.lastMeasuredIndex) {

            let last = this.getLastMeasuredItemSizeInfo();
            let offset = last.offset + last.size;

            for (let i = this.lastMeasuredIndex + 1; i <= index; i++) {

                const size = this.ensureItemSizeInfo(i, offset);

                offset += size.size;
            }
        }

        return this.cache[index];
    }

    // 确保当前单元格的大小是存在的
    private ensureItemSizeInfo(index: number, offset: number): IListSizeInfo {

        this.lastMeasuredIndex = index;

        const size = this.getItemSize(index);

        if (size === false) {
            return this.cache[index] = {
                offset,
                index,
                dynamic: true,
                measured: false,
                size: this.estimatedSize
            };
        }

        return {
            offset,
            index,
            dynamic: false,
            measured: true,
            size
        };
    }

    // 获取距离offset最近的index
    private getNearestIndexOfOffset(offset: number): number {

        offset = Math.max(offset, 0);

        const {offset: lastOffset, size} = this.getLastMeasuredItemSizeInfo();
        const index = Math.max(0, this.lastMeasuredIndex);

        if (offset <= lastOffset) {
            return this.searchIndexWithOffset(index, 0, offset);
        }

        let last = lastOffset + size;

        while (index < this.count && last < offset) {
            const size = this.ensureItemSizeInfo(index, last);
            last += size.size;
        }

        return index;
    }

    // 根据Offset获取Index
    private searchIndexWithOffset(high: number, low: number, offset: number): number {

        while (low <= high) {

            const middle = low + Math.floor((high - low) / 2);
            const size = this.getItemSizeInfo(middle).offset;

            if (size === offset) {
                return middle;
            } else if (size < offset) {
                low = middle + 1;
            } else if (size > offset) {
                high = middle - 1;
            }
        }

        if (low > 0) {
            return low - 1;
        }

        return 0;
    }

    // 获取元素大小
    private getItemSize(index: number): false | number {

        if (this.size === false || typeof this.size === 'number') {
            return this.size;
        }

        return this.size(index);
    }

    // 重置所有还没监控到的动态属性
    private resetDynamic(delta: number): boolean {

        let needAddDelta = 0;

        for (let i = 0; i <= this.lastMeasuredIndex; i++) {

            const item = this.cache[i];

            item.offset += needAddDelta;

            if (item.dynamic && !item.measured) {
                item.size = this.estimatedSize;
                needAddDelta += delta;
            }
        }

        return needAddDelta !== 0;
    }
}
