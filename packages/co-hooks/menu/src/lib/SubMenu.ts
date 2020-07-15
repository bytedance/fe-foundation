/**
 * @file SubMenu
 */
import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {ISubMenuOptions} from '../types';
import {Menu} from './Menu';
import {IMenuItem} from './MenuItem';

interface Events {
    'opened-update': [boolean];
}

export class SubMenu<P> extends Emitter<Events> implements IMenuItem<P> {
    private level: number = 1;

    private readonly insId: string;

    private readonly parent: SubMenu<P> | null = null;

    private readonly rootMenu: Menu<P>;

    private readonly itemMap: { [id: string]: IMenuItem<P> } = {};

    private id: string = '';

    private disposed: boolean = false;

    constructor(rootMenu: Menu<P>, options: ISubMenuOptions, parent: SubMenu<P> | null, insId?: string) {
        super();

        this.parent = parent;
        this.rootMenu = rootMenu;
        this.insId = insId || guid();

        this.updateSubMenuOptions(options);
        this.init();
    }

    private get opened(): boolean {
        return this.rootMenu.isOpened(this.id);
    }

    public updateSubMenuOptions(options: ISubMenuOptions): void {
        const {id} = options;

        this.id = id;
    }

    public getInsId(): string {
        return this.insId;
    }

    public getInsIdsPath(): string[] {
        const insIds = [this.insId];

        if (this.parent) {
            return this.parent.getInsIdsPath().concat(insIds);
        }

        return insIds;
    }

    public getId(): string {
        return this.id;
    }

    public getLevel(): number {
        return this.level;
    }

    public isSubMenu(): boolean {
        return true;
    }

    public setLevel(): void {
        if (this.parent) {
            this.level = this.parent.getLevel() + 1;
        } else {
            this.level = 1;
        }
    }

    public setActive(): void {
        this.rootMenu.setActiveMenus(this.id);

        if (this.parent != null) {
            this.parent.setActive();
        }
    }

    public getActive(): boolean {
        const activeMenus = this.rootMenu.getActiveMenus();
        return activeMenus.indexOf(this.id) > -1;
    }

    public getOpened(): boolean {
        return this.opened;
    }

    public updateOpened(open: boolean, deep: boolean = false): void {
        this.doSetOpened(open, deep);
        this.rootMenu.emitOpenMenusUpdate();
    }

    public setOpened(open: boolean, deep: boolean = false): void {
        this.doSetOpened(open, deep);
        this.rootMenu.emitOpenMenusUpdate();
        this.rootMenu.emitOpenMenusChange();
    }


    public updateParentOpenedState(open: boolean): void {
        let parent = this.parent;
        while (parent) {
            parent.updateOpenedState(open);
            parent = parent.parent;
        }
    }

    public updateChildOpenedState(open: boolean): void {
        Object.keys(this.itemMap).forEach(insId => {
            const subMenu = this.itemMap[insId];
            if (!subMenu.isSubMenu()) {
                return;
            }

            const opened = subMenu.getOpened();

            if (open !== opened) {
                subMenu.updateOpenedState(open);
                subMenu.updateChildOpenedState(open);
            }
        });
    }

    public updateOpenedState(open: boolean): void {
        if (this.opened === open) {
            return;
        }
        this.rootMenu.setOpen(this.insId, this.id, open);
    }

    public register(item: IMenuItem<P>): void {
        const id = item.getInsId();

        if (this.itemMap[id]) {
            return;
        }

        this.itemMap[id] = item;
    }

    public unregister(item: IMenuItem<P>): void {
        const id = item.getInsId();

        if (!this.itemMap[id]) {
            return;
        }

        delete this.itemMap[id];
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        if (this.parent) {
            this.parent.unregister(this);
        }

        this.rootMenu.unregisterSubMenu(this);
        this.disposed = true;
    }

    private init(): void {
        this.setLevel();
        if (this.parent) {
            this.parent.register(this);
        }

        this.rootMenu.registerSubMenu(this);
    }

    private doSetOpened(open: boolean, deep: boolean = false): void {
        if (this.rootMenu.getAccordion()) { // 手风琴模式
            if (this.parent) {
                this.parent.updateChildOpenedState(false);
            } else { // 没有 parent 说明是 root，重置 openIds
                this.rootMenu.setOpenIds([]);
            }
        }
        if (deep) {
            if (open && this.parent) { // 打开所有的 parent menu
                this.updateParentOpenedState(open);
            } else if (!open) { // 关闭所有的 child menu
                this.updateChildOpenedState(open);
            }
        }

        this.updateOpenedState(open);
    }
}
