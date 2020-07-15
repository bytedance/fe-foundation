/**
 * @file Collapse
 */

import {Emitter} from '@co-hooks/emitter';
import {shallowArray} from '@co-hooks/util';
import {SubCollapse} from './SubCollapse';

export interface IRcCollapse {
    lazy?: boolean;
    openIds?: string[];
    accordion?: boolean;
}

export type IRcCollapseOptions = IRcCollapse;

export interface ICollapseEvent {
    'open-ids-change': [string[]];
}

export class Collapse extends Emitter<ICollapseEvent> {
    // 展开keys
    public openIds: string[] = [];

    private lazy: boolean = false;

    private accordion: boolean = false;

    private subCollapseMap: {[key: string]: SubCollapse} = {};

    private originOpenIds: string[] = [];

    private init: boolean = false;

    /**
     * 更新组件配置
     *
     * @param options 配置
     */
    public updateCollapse(options: IRcCollapse): void {
        const {
            openIds = [],
            accordion = false,
            lazy = false
        } = options;

        this.lazy = lazy;
        this.accordion = accordion;
        if (!shallowArray(openIds, this.originOpenIds) || !this.init) {
            this.originOpenIds = openIds;

            if (!shallowArray(this.openIds, openIds)) {
                this.openIds = openIds.slice(0);
                this.init && this.emitOpenIdsChange();
            }

            this.init = true;
        }
    }

    public getLazy(): boolean {
        return this.lazy;
    }

    public getAccordion(): boolean {
        return this.accordion;
    }

    public isOpened(id: string): boolean {
        return this.openIds.indexOf(id) >= 0;
    }

    public setOpen(insId: string, id: string, open?: boolean): void {
        if (!this.subCollapseMap[insId]) {
            throw new Error(`SetOpen failed because insId=${insId} has not been registered in current collapse`);
        }
        const openIds = this.openIds;
        const idx = openIds.indexOf(id);

        if (open && idx < 0) {
            openIds.push(id);
        } else if (!open && idx >= 0) {
            openIds.splice(idx, 1);
        }
    }

    public setOpenById(id: string, open: boolean): void {
        let subCollapse: SubCollapse | null = null;

        if (this.isOpened(id) === open) {
            return;
        }

        Object.keys(this.subCollapseMap).some(insId => {
            if (this.subCollapseMap[insId].getId() === id) {
                subCollapse = this.subCollapseMap[insId];
                return true;
            }
        });

        if (subCollapse == null) {
            return;
        }

        (subCollapse as SubCollapse).setOpened(open);

        // this.emitOpenIdsChange();
    }

    public setOpenIds(ids: string[]): void {
        this.openIds = ids;
    }

    public resetOpenIds(): void {
        this.setOpenIds([]);
        this.emitOpenIdsChange();
    }

    public emitOpenIdsChange(): void {
        // console.trace();
        this.emit('open-ids-change', this.openIds);
    }

    public registerSubCollapse(subCollapse: SubCollapse): void {
        const id = subCollapse.getInsId();

        if (this.subCollapseMap[id]) {
            throw new Error(`id=${id} subCollapse has been registered`);
        }

        this.subCollapseMap[id] = subCollapse;
    }

    public unregisterSubCollapse(subCollapse: SubCollapse): void {
        const id = subCollapse.getInsId();

        if (!this.subCollapseMap[id]) {
            throw new Error(`id=${id} subCollapse has been unregistered`);
        }

        delete this.subCollapseMap[id];
    }

    public dispose(): void {
        Object.keys(this.subCollapseMap).forEach(
            id => this.subCollapseMap[id] && this.subCollapseMap[id].dispose()
        );
    }
}
