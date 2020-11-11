/**
 * @file PreviewBrick
 */
import {IBoardConfig, IBrickData} from '@chief-editor/base';
import {clone} from '@co-hooks/util';
import {DiffType, IBrickPropMergedDiffs} from '../types';
import {PreviewTemplate} from './PreviewTemplate';
import {PreviewBoard} from './PreviewBoard';
import {EditableBaseBrick, IEditorBrickInstanceOptions} from './EditableBaseBrick';

export interface IBrickOptions {
    status: DiffType;
    diffs?: IBrickPropMergedDiffs;
}

export class PreviewBrick<V, DS, DP, CG, ST> extends EditableBaseBrick<V, DS, DP, CG, ST> {

    protected board: PreviewBoard;

    protected template: PreviewTemplate;

    constructor(
        template: PreviewTemplate,
        board: PreviewBoard,
        options: Omit<IEditorBrickInstanceOptions<V, DS, DP, CG, ST>, 'owner'>
    ) {

        super({
            owner: template,
            data: options.data,
            config: options.config,
            scheduler: options.scheduler
        });

        this.board = board;
        this.template = template;
    }

    public getOwnerBoard(): PreviewBoard {
        return this.board;
    }

    public getOwnerTemplate(): PreviewTemplate {
        return this.template;
    }

    public getParts(): Record<string, PreviewBoard> {

        const res: Record<string, PreviewBoard> = {};

        Object.keys(this.parts).forEach(key => {
            res[key] = this.getOwnerTemplate().getBoardByNode(this.parts[key]);
        });

        return res;
    }

    public getCleanRemoveBoardData(cleanBrickId: boolean = false): IBrickData<V, DS, DP, CG, ST> {

        const data = clone(this.getData());
        const template = this.template;

        if (data == null || template == null) {
            throw new Error('call method `initEditorBrickInstance` first');
        }

        if (cleanBrickId) {
            delete data.id;
        }

        if (!Object.keys(this.parts).length) {
            return data;
        }

        const parts: Record<string, IBoardConfig> = {};

        Object.keys(this.parts).forEach(key => {
            const {bricks, ...extra} = template.getBoardByNode(this.parts[key]).getCleanRemoveBoardData(cleanBrickId);
            parts[key] = {
                bricks,
                ...extra
            };
        });

        return {
            ...data,
            parts
        };
    }

    public setDiffOptions(options: IBrickOptions): void {
        Object.assign(this, options);
    }

    public isActiveBrick(): boolean {
        return this.getOwnerTemplate().getActiveBrickId() === this.id;
    }

    public setActive(): void {
        this.getOwnerTemplate().setActiveBrickId(this.id);
    }
}

export type PreviewBrickGlobal = PreviewBrick<any, any, any, any, any>;
