/**
 * @file MenuItem
 */

import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {IMenuItemOptions} from '../types';
import {Menu} from './Menu';
import {SubMenu} from './SubMenu';

export interface IMenuItem<P> {
    getInsId: () => string;
    getInsIdsPath: () => string[];
    getId: () => string;
    isSubMenu: () => this is SubMenu<P>;
}

export class MenuItem<P> extends Emitter<{}> implements IMenuItem<P> {
    private level: number = 1;

    private readonly insId: string;

    private readonly parent: SubMenu<P> | null = null;

    private readonly rootMenu: Menu<P>;

    private id: string = '';

    private disposed: boolean = false;

    constructor(rootMenu: Menu<P>, parent: SubMenu<P> | null, insId?: string) {
        super();

        this.parent = parent;
        this.rootMenu = rootMenu;
        this.insId = insId || guid();

        this.init();
    }

    public get opened(): boolean {
        return this.rootMenu.isOpened(this.id);
    }

    public isSubMenu(): boolean {
        return false;
    }

    public updateMenuItemOptions(options: IMenuItemOptions): void {
        const {id} = options;
        this.id = id;
        if (this.getActive()) {
            this.setParentActive();
        }
        if (this.opened && this.parent) {
            this.parent.updateOpened(true, true);
        }
    }

    public getInsId(): string {
        return this.insId;
    }

    public getInsIdsPath(): string[] {
        const ids = [this.insId];

        if (this.parent) {
            return this.parent.getInsIdsPath().concat(ids);
        }

        return ids;
    }

    public getId(): string {
        return this.id;
    }

    public getActive(): boolean {
        return this.rootMenu.getActiveId() === this.id;
    }

    public setActive(): void {
        this.rootMenu.setActiveItem(this.insId, this.id);
        this.setParentActive();
    }

    public setParentActive(): void {
        this.rootMenu.setActiveMenus(null); // 先清空 active menus
        this.parent && this.parent.setActive(); // 设置 active menus
        this.rootMenu.emit('active-menus-update', this.rootMenu.getActiveMenus()); // 已设置完成 active menus，触发事件
    }

    public getParent(): SubMenu<P> | null {
        return this.parent;
    }

    public getLevel(): number {
        return this.level;
    }

    public setLevel(): void {
        if (this.parent) {
            this.level = this.parent.getLevel() + 1;
        } else {
            this.level = 1;
        }
        this.rootMenu.setDepth(this.level);
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        if (this.parent) {
            this.parent.unregister(this);
        }

        this.rootMenu.unregisterMenuItem(this);
        this.disposed = true;
    }

    private init(): void {
        this.setLevel();
        if (this.parent) {
            this.parent.register(this);
        }

        this.rootMenu.registerMenuItem(this);
    }
}
