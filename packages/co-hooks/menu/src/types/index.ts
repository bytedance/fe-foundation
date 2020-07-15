/**
 * @file usePrevProp 保存之前的属性
 */

export type IMenuTrigger = 'hover' | 'click';

// inline：子菜单内嵌模式 vertical：子菜单弹出模式
export type IMenuType = 'vertical' | 'horizontal' | 'inline';

export interface IMenuOptions<P> {
    type?: IMenuType;
    trigger?: IMenuTrigger;
    openIds?: string[];
    activeId?: string;
    collapse?: boolean;
    accordion?: boolean;
    extraProps?: P;
}

export interface IMenuItemOptions {
    id: string;
    disabled?: boolean;
}

export interface ISubMenuOptions {
    id: string;
    disabled?: boolean;
}
