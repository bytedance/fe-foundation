/**
 * @file Select
 */
import {Emitter} from '@co-hooks/emitter';
import {IOptionData, Option, OptionState} from './Option';
import {OptionGroup} from './OptionGroup';

export type ISelectQuery<T> = (query: string, option: IOptionData<T>) => boolean;

export enum SelectAllEnum {
    ALL = '__all__'
}

export interface ISelectOptionsExtra<T, P> {
    filterOption?: ISelectQuery<T>;
    value: T[];
    multiple?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    showAll?: boolean;
    extraProps: P;
}

export type ISelectOptions<T, P> = ISelectOptionsExtra<T, P>;

export interface ISelectDisplayInfoItem<T> extends IOptionData<T> {
    id: string;
}

export interface IQueryItemGroupData {
    type: 'group';
    title: string;
}

export interface IQueryItemOptionData<T> extends IOptionData<T> {
    type: 'option';
}

export interface IQueryItemAllData {
    type: 'all';
}

export interface IQueryItems<T> {
    [key: string]: IQueryItemData<T>;
}

export interface ISelectEvent<T> {
    'update-select-all-state': [];
    'back-fill-update': [string];
    'search-query': [IQueryItems<T>];
    'value-change': [T[], Array<ISelectDisplayInfoItem<T>>];
    'try-set-state': [string, OptionState];
    'query-change': [string];
    'select-option-update': [];
    'select-label-update': [];
}

export type IQueryItemData<T> = IQueryItemGroupData | IQueryItemOptionData<T> | IQueryItemAllData;

export class Select<T, P> extends Emitter<ISelectEvent<T>> {

    public multiple: boolean = false;

    public disabled: boolean = false;

    public readonly: boolean = false;

    public searchQuery: string = '';

    private optionMap: {[key: string]: Option<T, P>} = {};

    private optionIdSort: string[] = [];

    private groupMap: {[key: string]: OptionGroup<T, P>} = {};

    private value: T[] = [];

    private extraProps?: P;

    private backFillId: string = '';

    private selectAllDisabled: boolean = false;

    private selectAllReadonly: boolean = false;

    private selectAll: boolean = false;

    private showAll: boolean = false;

    private showOptionsIdSort: string[] = [];

    constructor(options: ISelectOptions<T, P>) {
        super();

        this.updateSelectOptions(options);
    }

    public dispose(): void {
        Object.keys(this.optionMap).forEach(id => {
            this.optionMap[id].dispose();
        });

        Object.keys(this.groupMap).forEach(id => {
            this.groupMap[id].dispose();
        });

        this.optionMap = {};
        this.groupMap = {};
    }

    public updateSelectOptions(options: ISelectOptions<T, P>): void {
        const {
            filterOption = this.defaultQuery,
            multiple = false,
            disabled = false,
            readonly = false,
            value,
            showAll = false,
            extraProps
        } = options;

        const needUpdateOptionData = this.value !== value
            || this.disabled !== disabled
            || this.readonly !== readonly;

        this.filterOption = filterOption;
        this.multiple = multiple;
        this.value = value;
        this.disabled = disabled;
        this.readonly = readonly;

        this.extraProps = extraProps;

        if (needUpdateOptionData) {
            this.updateOptionData();
        }

        if (this.showAll !== showAll) {
            this.showAll = showAll;
            if (!this.searchQuery && showAll) {
                this.showOptionsIdSort.unshift(SelectAllEnum.ALL);
            } else if (!showAll && this.showOptionsIdSort[0] === SelectAllEnum.ALL) {
                this.showOptionsIdSort.shift();
            }
        }

        const newDisabled = this.isSelectAllDisabled();
        const newReadonly = this.isSelectAllReadonly();
        const newSelectAll = this.isSelectAll();

        const needUpdateSelectAll = this.selectAllDisabled !== newDisabled
            || this.selectAllReadonly !== newReadonly
            || this.selectAll !== newSelectAll;

        this.selectAllDisabled = newDisabled;
        this.selectAllReadonly = newReadonly;
        this.selectAll = newSelectAll;

        if (needUpdateSelectAll) {
            this.emit('update-select-all-state');
        }
    }

    public updateOptionIdSort(ids: string[]): void {
        if (this.optionIdSort.join(',') === ids.join(',')) {
            return;
        }

        this.optionIdSort = ids;
        this.showOptionsIdSort = this.optionIdSort.slice(0);

        if (this.showAll) {
            this.showOptionsIdSort.unshift(SelectAllEnum.ALL);
        }
    }

    public stepUp(): void {
        const len = this.showOptionsIdSort.length;

        if (!len) {
            this.backFillId = '';
            this.emit('back-fill-update', this.backFillId);
            return;
        }

        const idx = this.showOptionsIdSort.indexOf(this.backFillId || '');

        if (idx < 0) {
            this.backFillId = this.showOptionsIdSort[0];
        } else {
            this.backFillId = this.showOptionsIdSort[(idx + len - 1) % len];
        }

        this.emit('back-fill-update', this.backFillId);
    }

    public stepDown(): void {
        const len = this.showOptionsIdSort.length;

        if (!len) {
            this.backFillId = '';
            return;
        }

        const idx = this.showOptionsIdSort.indexOf(this.backFillId || '');

        if (idx < 0) {
            this.backFillId = this.showOptionsIdSort[0] || '';
        } else {
            this.backFillId = this.showOptionsIdSort[(idx + len + 1) % len];
        }

        this.emit('back-fill-update', this.backFillId);
    }

    public selectBackFill(): void {
        if (!this.backFillId) {
            return;
        }

        if (this.backFillId === SelectAllEnum.ALL) {
            this.setSelectAll(this.selectAll ? OptionState.UNSELECTED : OptionState.SELECTED);
            return;
        }

        const option = this.optionMap[this.backFillId];
        const {selected} = option.getData();

        option.setOptionState(selected ? OptionState.UNSELECTED : OptionState.SELECTED);
    }

    public registerOption(option: Option<T, P>): void {
        const id = option.getId();

        if (this.optionMap[id]) {
            throw new Error(`id=${id} option component has been registered`);
        }

        this.optionMap[id] = option;

        this.emit('select-option-update');
    }

    public unregisterOption(option: Option<T, P>): void {
        const id = option.getId();

        if (!this.optionMap[id]) {
            throw new Error(`id=${id} option component does not been registered`);
        }

        delete this.optionMap[id];
        this.emit('select-option-update');
    }

    public registerOptionGroup(optionGroup: OptionGroup<T, P>): void {
        const id = optionGroup.getId();

        if (this.optionMap[id]) {
            throw new Error(`id=${id} optionGroup component has been registered`);
        }

        this.groupMap[id] = optionGroup;
    }

    public unregisterOptionGroup(optionGroup: OptionGroup<T, P>): void {
        const id = optionGroup.getId();

        if (!this.groupMap[id]) {
            throw new Error(`id=${id} optionGroup component dose not been registered`);
        }

        delete this.groupMap[id];
    }

    public setQuery(query: string): void {
        this.searchQuery = query;
        this.emit('query-change', this.searchQuery);
        this.emit('search-query', this.querySearch());
    }

    public setSelect(optionId: string, state: OptionState): void {
        const option = this.optionMap[optionId];
        const optionValue = option.getData().value;
        let value = this.value.slice(0);
        const idx = value.indexOf(optionValue);

        if (state === OptionState.UNSELECTED) {
            // 当前就是未选中 或者是 单选，不能取消选中
            if (idx < 0 || !this.multiple) {
                return;
            }
            value.splice(idx, 1);
            this.emit('value-change', value, this.getDisplayInfo(value));
            return;
        }

        if (state === OptionState.SELECTED) {
            if (idx >= 0) {
                return;
            }

            if (this.multiple) {
                value.push(optionValue);
            } else {
                value = [optionValue];
            }

            this.emit('value-change', value, this.getDisplayInfo(value));
        }
    }

    public trySetSelect(optionId: string, state: OptionState): void {
        this.emit('try-set-state', optionId, state);
    }

    public setSelectAll(state: OptionState): void {
        if (!this.multiple) {
            return;
        }

        if (state === OptionState.UNSELECTED) {
            this.emit('value-change', [], []);
        } else {
            const value = this.optionIdSort.map(id => {
                const {value, disabled} = this.optionMap[id].getData();
                return disabled ? null : value;
            }).filter(value => value != null) as T[];

            this.emit('value-change', value, this.getDisplayInfo(value));
        }
    }

    public resetValue(): void {
        this.emit('value-change', [], []);
    }

    public isDisabled(): boolean {
        return this.disabled;
    }

    public isReadonly(): boolean {
        return this.readonly;
    }

    public isSelected(value: T): boolean {
        return this.value.indexOf(value) >= 0;
    }

    public getShowOptionsIdSort(): string[] {
        return this.showOptionsIdSort;
    }

    public getSelectAllDisabled(): boolean {
        return this.selectAllDisabled;
    }

    public getSelectAllReadonly(): boolean {
        return this.selectAllReadonly;
    }

    public getSelectAll(): boolean {
        return this.selectAll;
    }

    public getExtraProps(): P | undefined {
        return this.extraProps;
    }

    public getOption(id: string): Option<T, P> {
        return this.optionMap[id];
    }

    public getDisplayInfo(value?: T[]): Array<ISelectDisplayInfoItem<T>> {
        const innerValue = value || this.value;
        const info: Array<ISelectDisplayInfoItem<T>> = [];
        Object.keys(this.optionMap).forEach(id => {
            const option = this.optionMap[id];
            const data = option.getData();

            if (innerValue.indexOf(data.value) >= 0) {
                info.push({
                    label: data.label,
                    value: data.value,
                    disabled: data.disabled,
                    readonly: data.readonly,
                    id
                });
            }
        });

        return info;
    }

    // 加载数据源函数
    protected filterOption: ISelectQuery<T> = (query, data) => this.defaultQuery(query, data);

    private updateOptionData(): void {
        Object.keys(this.optionMap).forEach(id => {
            const option = this.optionMap[id];
            const data = option.getData();
            const value = data.value;

            const disabled = data.disabled || this.disabled;
            const readonly = data.readonly || this.readonly;
            const selected = this.value.indexOf(value) >= 0;

            let needOptionUpdate = false;

            if (disabled !== data.disabled) {
                data.disabled = disabled;
                needOptionUpdate = true;
            }

            if (readonly !== data.readonly) {
                data.readonly = readonly;
                needOptionUpdate = true;
            }

            if (selected !== data.selected) {
                option.updateSelected(selected);
                return;
            }

            if (needOptionUpdate) {
                option.stateUpdated();
            }
        });
    }

    private defaultQuery(query: string, optionData: IOptionData<T>): boolean {
        const label = optionData.label;

        if (!this.searchQuery) {
            return true;
        }
        return label.indexOf(this.searchQuery) >= 0;
    }

    private querySearch(): IQueryItems<T> {
        const res: {[key: string]: IQueryItemData<T>} = {};
        Object.keys(this.optionMap).forEach(id => {
            const option = this.optionMap[id];
            const data = option.getData();
            const ids = option.getOptionIdPath();

            ids.pop();

            if (!this.filterOption(this.searchQuery, data)) {
                return;
            }

            res[id] = {
                ...data,
                type: 'option'
            };

            if (!ids.length) {
                return;
            }

            ids.forEach(groupId => {
                if (res[groupId]) {
                    return;
                }

                const group = this.groupMap[groupId];

                res[groupId] = {
                    type: 'group',
                    title: group.getTitle()
                };
            });
        });

        if (Object.keys(res).length) {
            res[SelectAllEnum.ALL] = {
                type: 'all'
            };
        }

        this.calcShowOptionsIdSort(res);

        return res;
    }

    private calcShowOptionsIdSort(data: IQueryItems<T>): void {
        const newIdSort: string[] = [];
        this.optionIdSort.forEach(id => {
            if (data[id]) {
                newIdSort.push(id);
            }
        });

        if (this.showAll && !this.searchQuery) {
            newIdSort.unshift(SelectAllEnum.ALL);
        }

        this.showOptionsIdSort = newIdSort;
    }

    private isSelectAllDisabled(): boolean {
        const optLen = Object.keys(this.optionMap).length;
        return !!optLen && Object.keys(this.optionMap).every(id => this.optionMap[id].getData().disabled);
    }

    private isSelectAllReadonly(): boolean {
        const optLen = Object.keys(this.optionMap).length;
        return !!optLen && Object.keys(this.optionMap).every(id => this.optionMap[id].getData().readonly);
    }

    private isSelectAll(): boolean {
        const optLen = Object.keys(this.optionMap).length;

        if (!optLen) {
            return false;
        }

        return Object.keys(this.optionMap)
            .filter(id => !this.optionMap[id].getData().disabled)
            .every(id => this.optionMap[id].getData().selected);
    }
}
