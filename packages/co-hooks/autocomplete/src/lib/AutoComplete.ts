/**
 * @file AutoComplete 自动完成
 */

import {deepEqual, getKeys} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';

export interface IDataSourceItem<T> {
    value: T;
    label: string;
    disabled?: boolean;
}

export interface IAutoCompleteOptions<T> {
    keyword?: string;
    disabled?: boolean;
    multiple?: boolean;
    checkable?: boolean;
    allowClear?: boolean;
    dataSource: IDataSourceItem<T>[];
    selectedValue?: IDataSourceItem<T>[];
    filterOption?: (keyword: string, item: IDataSourceItem<T>) => boolean;
}

export interface IAutoCompleteEvents<T> {
    'update': [];
    'on-select': [T[]];
    'on-search': [string];
}

export class AutoComplete<T> extends Emitter<IAutoCompleteEvents<T>> {
    public keyword: string = '';
    public activeIndex: number | null = null;
    public multiple: boolean = false;
    public checkable: boolean = true;
    public disabled: boolean = false;
    public allowClear: boolean = true;
    public selectedValue: IDataSourceItem<T>[] = [];
    public dataSource: IDataSourceItem<T>[] = [];

    public updateOptions(options: IAutoCompleteOptions<T>): void {
        getKeys(options).forEach(key => {
            if (options[key] !== undefined) {
                Object.assign(this, {
                    [key]: options[key]
                });
            }
        });
    }

    public reset(): void {
        this.activeIndex = null;
        if (this.multiple) {
            this.keyword = '';
        }
    }

    public onClear(): void {
        this.keyword = '';
        this.activeIndex = null;
        this.selectedValue = [];
        this.emit('on-select', []);
        this.update();
    }

    public onKeywordChange(keyword: string): void {
        this.keyword = keyword;
        this.emit('on-search', keyword);
        this.update();
    }

    public handleSelect(chooseData: IDataSourceItem<T>): void {
        if (this.multiple) {
            const originData = [...this.selectedValue];
            const notExist = this.selectedValue.every((item, index) => {
                const isEqual = deepEqual(chooseData.value, item.value);
                isEqual && originData.splice(index, 1);
                return !isEqual;
            });
            notExist && originData.push(chooseData);

            const filterData = originData.map(item => item.value);
            this.selectedValue = originData;
            this.emit('on-select', filterData);
        } else {
            this.keyword = chooseData.label;
            this.emit('on-select', [chooseData.value]);
        }
        this.update();
    }

    public getFilterData(): IDataSourceItem<T>[] {
        return this.dataSource.filter(item => this.filterOption(this.keyword, item));
    }

    public selectBackFill(): void {
        if (this.activeIndex === null) {
            return;
        }

        const filterData = this.getFilterData();
        filterData.length > 0 && this.handleSelect(filterData[this.activeIndex]);
    }

    public stepDown(): void {
        const length = this.getFilterData().length;

        if (this.disabled) {
            return;
        }

        if (this.activeIndex === null) {
            this.activeIndex = 0;
        } else {
            if (this.activeIndex + 1 > length - 1) {
                this.activeIndex = 0;
            } else {
                this.activeIndex += 1;
            }
        }

        this.update();
    }

    public stepUp(): void {
        const length = this.getFilterData().length;

        if (this.disabled) {
            return;
        }

        if (this.activeIndex === null) {
            this.activeIndex = 0;
        } else {
            if (this.activeIndex - 1 < 0) {
                this.activeIndex = length - 1;
            } else {
                this.activeIndex -= 1;
            }
        }

        this.update();
    }

    public filterOption(keyword: string, item: IDataSourceItem<T>): boolean {
        return item.label.toLowerCase().includes(keyword);
    }

    private update(): void {
        this.emit('update');
    }
}
