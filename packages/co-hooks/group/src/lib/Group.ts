/**
 * @file Group 分组操作类
 */

import {guid} from '@co-hooks/util';
import {GroupItem} from './GroupItem';

export interface IGroupOptions<T, P> {
    disabled: boolean;
    extraProps: P;
    value: T[];
    onChange: (value: T[]) => void;
}

export class Group<T, P> {

    public static GROUP_FREE: string = guid();

    // 是否禁用
    public disabled: boolean;

    // 额外的属性
    public extraProps: P;

    // 当前值
    public value: T[];

    // 变更函数
    public onChange: (value: T[]) => void;

    // 当前激活的组
    private group: string = Group.GROUP_FREE;

    // 当前是否已经销毁
    private disposed: boolean = false;

    // 子项目索引
    private map: {[key: string]: GroupItem<T, P>} = {};

    constructor(conf: IGroupOptions<T, P>) {

        const {
            disabled,
            extraProps,
            value,
            onChange
        } = conf;

        this.extraProps = extraProps;
        this.disabled = disabled;
        this.value = value;
        this.onChange = onChange;
    }

    // 更新组信息
    public updateGroupOptions<K extends IGroupOptions<T, P>>(conf: K): Omit<K, keyof IGroupOptions<T, P>> {

        const {
            disabled,
            extraProps,
            value,
            onChange,
            ...extra
        } = conf;

        this.extraProps = extraProps;
        this.disabled = disabled;
        this.value = value;
        this.onChange = onChange;

        // 最后一个生效
        let group = Group.GROUP_FREE;

        Object.keys(this.map).forEach(key => {
            const item = this.map[key];
            if (value.indexOf(item.value) >= 0) {
                group = item.group;
            }
        });

        this.group = group;

        // 更新了组信息
        Object.keys(this.map).forEach(key => this.map[key].emitGroupChange());

        return extra;
    }

    public onItemChange(item: GroupItem<T, P>, checked: boolean): void {

        if (item.free) {
            this.onChange([]);
            this.group = Group.GROUP_FREE;
            return;
        }

        const value = this.value.slice();
        const index = this.value.indexOf(item.value);

        if (index >= 0) {

            if (!checked) {
                value.splice(index, 1);
                this.onChange(value);
            }

            return;
        }

        if (!checked) {
            return;
        }

        if (value.length === 0 || item.group !== this.group) {
            this.onChange([item.value]);
            return;
        }

        this.onChange(value.concat(item.value));
    }

    public isItemChecked(item: GroupItem<T, P>): boolean {
        return item.free
            ? this.value.length === 0
            : this.value.indexOf(item.value) >= 0;
    }

    // 注册子项目
    public register(item: GroupItem<T, P>): void {

        if (this.map[item.id]) {
            console.error(`duplicated group item: ${item.value}`);
        }

        // 如果初始化的值在已选择的值中，设置group，初始值Group正确性依赖外部
        if (this.value.indexOf(item.value) >= 0) {
            this.group = item.group;
        }

        this.map[item.id] = item;
    }

    // 解除子项目注册
    public unregister(item: GroupItem<T, P>): void {

        if (this.disposed) {
            return;
        }

        if (!this.map[item.id]) {
            console.error(`item ${item.value} is not registered in this group`);
        }

        delete this.map[item.id];

        // 如果被删除的元素在值里
        const value = this.value.slice();
        const index = value.indexOf(item.value);

        if (index >= 0) {
            value.splice(index, 1);
            this.onChange(value);
        }
    }

    public dispose(): void {
        this.disposed = true;
        Object.values(this.map).forEach(item => item.dispose());
        this.map = {};
    }
}
