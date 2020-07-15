/**
 * @file SubCollapse
 */
import {Collapse} from "./Collapse";
import {guid} from "@co-hooks/util";

export interface IRcSubCollapse {
    id: string;
}

export class SubCollapse {

    private readonly parent: SubCollapse | null = null;

    private rootCollapse: Collapse;

    private readonly insId: string;

    private id: string = '';

    private subCollapseMap: { [key: string]: SubCollapse } = {};

    private isDispose: boolean = false;

    constructor(root: Collapse, parent: SubCollapse | null = null, insId?: string) {
        this.rootCollapse = root;
        this.parent = parent;
        this.insId = insId || guid();

        this.rootCollapse.registerSubCollapse(this);

        if (this.parent) {
            this.parent.registerSubCollapse(this);
        }
    }

    public updateSubCollapseOption(options: IRcSubCollapse): void {
        const {id} = options;

        this.id = id;

        if (this.isOpened() && this.parent) {
            this.parent.updateOpened(true);
        }
    }

    public updateOpened(open: boolean): void {
        this.doSetOpened(open);
        this.rootCollapse.emitOpenIdsChange();
    }

    public setOpened(open: boolean): void {
        this.doSetOpened(open);
        this.rootCollapse.emitOpenIdsChange();
    }

    public updateParentOpenedState(open: boolean): void {
        let parent = this.parent;
        while (parent) {
            parent.updateOpenedState(open);
            parent = parent.parent;
        }
    }

    public updateChildOpenedState(open: boolean): void {
        Object.keys(this.subCollapseMap).forEach(insId => {
            const collapseItem = this.subCollapseMap[insId];

            const opened = collapseItem.isOpened();

            if (open !== opened) {
                collapseItem.updateOpenedState(open);
                collapseItem.isSubCollapse() && collapseItem.updateChildOpenedState(open);
            }
        });
    }

    public updateOpenedState(open: boolean): void {
        if (this.isOpened() === open) {
            return;
        }
        this.rootCollapse.setOpen(this.insId, this.id, open);
    }

    public isSubCollapse(): boolean {
        return true;
    }

    public isOpened(): boolean {
        return this.rootCollapse.isOpened(this.id);
    }

    public getInsId(): string {
        return this.insId;
    }

    public getId(): string {
        return this.id;
    }

    public getInsIdsPath(): string[] {
        const ids = [this.insId];

        if (this.parent) {
            return this.parent.getInsIdsPath().concat(ids);
        }

        return ids;
    }

    public registerSubCollapse(subCollapse: SubCollapse): void {
        const id = subCollapse.getInsId();

        if (this.subCollapseMap[id]) {
            throw new Error(`id=${id} subCollapse have been registered`);
        }

        this.subCollapseMap[id] = subCollapse;
    }

    public unregisterSubCollapse(subCollapse: SubCollapse): void {
        const id = subCollapse.getInsId();

        if (!this.subCollapseMap[id]) {
            throw new Error(`id=${id} subCollapse have been unregistered`);
        }

        delete this.subCollapseMap[id];
    }

    public dispose(): void {
        if (this.isDispose) {
            return;
        }

        this.isDispose = true;
        this.rootCollapse.unregisterSubCollapse(this);
        this.parent && this.parent.unregisterSubCollapse(this);

        Object.keys(this.subCollapseMap).forEach(
            id => this.subCollapseMap[id] && this.subCollapseMap[id].dispose()
        );
    }

    private doSetOpened(open: boolean): void {
        if (this.rootCollapse.getAccordion()) { // 手风琴模式
            if (this.parent) {
                this.parent.updateChildOpenedState(false);
            } else { // 没有 parent 说明是 root，重置 openIds
                this.rootCollapse.setOpenIds([]);
            }
        }

        if (open && this.parent) { // 打开所有的 parent collapse
            this.updateParentOpenedState(open);
        } else if (!open) { // 关闭所有的 child collapse
            this.updateChildOpenedState(open);
        }

        this.updateOpenedState(open);
    }
}
