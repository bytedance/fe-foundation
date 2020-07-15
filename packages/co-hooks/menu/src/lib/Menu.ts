/**
 * @file Menu
 */

import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {IMenuOptions, IMenuTrigger, IMenuType} from '../types';
import {MenuItem} from './MenuItem';
import {SubMenu} from './SubMenu';

export interface Events {
    'active-item-change': [string]; // item 激活态变化，触发回调事件，不触发更新
    'active-item-update': [string]; //  item 激活态变化，不触发回调事件，触发更新 item 激活状态
    'active-menus-update': [string[]];
    'open-menus-change': [string[]]; // submenu 展开变化，触发回调事件，不触发更新
    'open-menus-update': []; // submenu 展开变化，不触发回调事件，触发更新展开状态
}

export class Menu<P> extends Emitter<Events> {
    private depth: number = 1;

    private readonly insId: string = guid();

    private readonly menuItemMap: {[id: string]: MenuItem<P>} = {};

    private readonly subMenuMap: {[id: string]: SubMenu<P>} = {};

    private openIds: string[] = [];

    private type: IMenuType = 'inline';

    private trigger: IMenuTrigger = 'hover';

    private activeId: string = '';

    private activeMenus: string[] = [];

    private collapse: boolean = false;

    private accordion: boolean = false;

    private extraProps?: P;

    constructor(options: IMenuOptions<P>) {
        super();
        this.updateMenuOptions(options);
    }

    public updateMenuOptions(options: IMenuOptions<P>): void {
        const {
            type = 'inline',
            openIds = [],
            trigger = 'hover',
            activeId,
            collapse = false,
            accordion = false,
            extraProps
        } = options;

        this.type = type;
        this.trigger = trigger;
        this.extraProps = extraProps;
        this.accordion = accordion;
        this.collapse = collapse;
        this.openIds = openIds.slice(0);

        if (activeId != null && this.activeId !== activeId) {
            this.activeId = activeId;
            this.emitActiveItemUpdate();
        }
    }

    public getType(): IMenuType {
        return this.type;
    }

    public getDepth(): number {
        return this.depth;
    }

    public setDepth(depth: number): void {
        if (depth > this.depth) {
            this.depth = depth;
        }
    }

    public getInsId(): string {
        return this.insId;
    }

    public getActiveId(): string {
        return this.activeId;
    }

    public getCollapse(): boolean {
        return this.collapse;
    }

    public getAccordion(): boolean {
        return this.accordion;
    }

    public setActiveMenus(menuId: string | null): void {
        if (menuId === null) {
            this.activeMenus = [];
        } else {
            this.activeMenus.push(menuId);
        }
    }

    public getActiveMenus(): string[] {
        return this.activeMenus;
    }

    public isOpened(id: string): boolean {
        return this.openIds.indexOf(id) >= 0;
    }

    public getOpenIds(): string[] {
        return this.openIds;
    }

    public setActiveItem(insId: string, id: string): void {
        if (!this.menuItemMap[insId]) {
            throw new Error(`insId=${insId} menu item dose not under current menu`);
        }

        const prevActiveId = this.activeId;

        this.activeId = id;
        this.emitActiveItemChange(); // 触发点击回调

        if (this.activeId !== prevActiveId) { // 如果 activeId 没有改变，不需要重新更新
            this.emitActiveItemUpdate();
        }
    }

    public getExtraProps(): P | {} {
        return this.extraProps || {};
    }

    public getTrigger(): IMenuTrigger {
        return this.trigger;
    }

    public emitOpenMenusChange(): void {
        this.emit('open-menus-change', this.openIds);
    }

    public emitOpenMenusUpdate(): void {
        this.emit('open-menus-update');
    }

    public emitActiveItemChange(): void {
        this.emit('active-item-change', this.activeId);
    }

    public emitActiveItemUpdate(): void {
        this.emit('active-item-update', this.activeId);
    }

    public setOpen(insId: string, id: string, open?: boolean): void {
        if (!this.subMenuMap[insId]) {
            throw new Error(`SetOpen failed because insId=${insId} subMenu has not been registered in current menu`);
        }
        const openIds = this.openIds;
        const idx = openIds.indexOf(id);

        if (open && idx < 0) {
            openIds.push(id);
        } else if (!open && idx >= 0) {
            openIds.splice(idx, 1);
        }
    }

    public setOpenIds(ids: string[]): void {
        this.openIds = ids;
    }

    public resetOpenIds(): void {
        this.setOpenIds([]);
        this.emitOpenMenusUpdate();
    }

    public registerMenuItem(menu: MenuItem<P>): void {
        const id = menu.getInsId();

        if (this.menuItemMap[id]) {
            throw new Error(`id=${id} menuItem has been registered`);
        }

        this.menuItemMap[id] = menu;
    }

    public unregisterMenuItem(menu: MenuItem<P>): void {
        const insId = menu.getInsId();

        if (!this.menuItemMap[insId]) {
            throw new Error(`insId=${insId} menuItem has not been registered in current menu`);
        }

        delete this.menuItemMap[insId];
    }

    public registerSubMenu(subMenu: SubMenu<P>): void {
        const insId = subMenu.getInsId();

        if (this.subMenuMap[insId]) {
            throw new Error(`insId=${insId} subMenu has been registered`);
        }

        this.subMenuMap[insId] = subMenu;
    }

    public unregisterSubMenu(subMenu: SubMenu<P>): void {
        const insId = subMenu.getInsId();

        if (!this.subMenuMap[insId]) {
            throw new Error(`insId=${insId} subMenu has not been registered in current menu`);
        }

        delete this.subMenuMap[insId];
    }

}
