/**
 * @file RadioGroupItem 单个Radio项目
 */

import {UnionOmit, guid, shallowMerge} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {Group} from './Group';

export interface IGroupItemOptions<T, P> {
    disabled: boolean;
    extraProps: Partial<P>;
    group: string;
    free: boolean;
    value: T;
}

export type IGroupItemRenderProps<T, P> = [
    UnionOmit<{ checked: boolean; disabled: boolean }, P>,
    (checked: boolean) => void
];

export interface IGroupItemEvent {
    'group-change': [];
}

export class GroupItem<T, P> extends Emitter<IGroupItemEvent> {

    // 所属编号
    public id: string = guid();

    // 所属分组
    public group: string;

    // 是否不限按钮
    public free: boolean;

    // 当前值
    public value: T;

    // 当前是否已经销毁
    private disposed: boolean = false;

    private readonly ownerGroup: Group<T, P>;

    constructor(ownerGroup: Group<T, P>, conf: IGroupItemOptions<T, P>) {
        super();

        this.group = conf.group;
        this.value = conf.value;
        this.free = !!conf.free;

        this.ownerGroup = ownerGroup;
        this.ownerGroup.register(this);
    }

    // 获取渲染配置
    public getGroupItemInfo(conf: IGroupItemOptions<T, P>): IGroupItemRenderProps<T, P> {

        this.updateOptions(conf);
        const disabled = this.ownerGroup.disabled || conf.disabled;
        const extraProps: P = shallowMerge(this.ownerGroup.extraProps, conf.extraProps);

        return [{
            disabled,
            checked: this.ownerGroup.isItemChecked(this),
            ...extraProps
        }, this.onChange];
    }

    public onChange: (checked: boolean) => void = checked => {
        this.ownerGroup.onItemChange(this, checked);
    };

    public dispose(): void {
        if (!this.disposed) {
            this.disposed = true;
            this.ownerGroup.unregister(this);
        }
    }

    public emitGroupChange(): void {
        this.emit('group-change');
    }

    private updateOptions(options: IGroupItemOptions<T, P>): void {
        if (options.group !== this.group || options.value !== this.value) {
            this.ownerGroup.unregister(this);
            this.group = options.group;
            this.value = options.value;
            this.ownerGroup.register(this);
        }
    }
}
