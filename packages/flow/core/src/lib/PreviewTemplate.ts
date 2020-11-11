/**
 * @file Template
 */
import {Emitter} from '@co-hooks/emitter';
import {BaseTemplate, IBoardConfig, IBrickDataGlobal, ITemplateConfig} from '@chief-editor/base';
import {IBrickPropMergedDiffs, IEditorBrickConfigGlobal, IEditorBrickConfigs} from '../types';
import {EditorScheduler} from './EditorScheduler';
import {PreviewBoard} from './PreviewBoard';
import {PreviewBrick, PreviewBrickGlobal} from './PreviewBrick';

export interface IPreviewTemplateConfig extends ITemplateConfig {
    brickConfigs: IEditorBrickConfigs;
}

export interface IPreviewTemplateEvent {
    'active-brick-change': [IBrickDiffInfo | null];
    'show-prop-update': [IBrickDiffInfo | null];
}

export interface IBrickDiffInfo {
    type: string;
    label: string;
    diffs: IBrickPropMergedDiffs;
}

export class PreviewTemplate extends BaseTemplate<PreviewBoard, PreviewBrickGlobal> {

    protected readonly brickConfigs: Record<string, IEditorBrickConfigGlobal>;

    protected activeBrickId: string | null = null;

    constructor(options: IPreviewTemplateConfig) {
        super(options.id);
        const {board, brickConfigs} = options;
        this.brickConfigs = brickConfigs;
        this.init(board);
    }

    public getCleanRemoveTemplateData(cleanId: boolean = false): ITemplateConfig {
        return {
            id: cleanId ? undefined : this.id,
            board: this.getRootBoard().getCleanRemoveBoardData(cleanId)
        };
    }

    public getBrickConfig(type: string): IEditorBrickConfigGlobal {
        return this.brickConfigs[type];
    }

    public getBoardMap(): Record<string, PreviewBoard> {
        return this.boardMap;
    }

    public getBrickMap(): Record<string, PreviewBrickGlobal> {
        return this.brickMap;
    }

    public getActiveBrickId(): string | null {
        return this.activeBrickId;
    }

    public getActiveBrickIdPath(): string[] {

        if (!this.activeBrickId) {
            return [];
        }

        const brick = this.getBrick(this.activeBrickId);

        if (!brick) {
            return [];
        }

        return brick.getNodePath().map(node => node.id);
    }

    public setActiveBrickId(id: string | null): void {

        const old = this.activeBrickId;
        this.activeBrickId = id;

        if (old !== id) {
            this.emit('active-brick-change', this.getActiveBrickDiffInfo());

            if (old != null) {
                this.getBrick(old).emit('active-change', false);
            }

            if (id != null) {
                this.getBrick(id).emit('active-change', true);
            }
        }
    }

    public getActiveBrickDiffInfo(): IBrickDiffInfo | null {

        if (this.activeBrickId == null) {
            return null;
        }

        const brick = this.getBrick(this.activeBrickId);

        if (brick.diffs == null) {
            return null;
        }

        return {
            type: brick.brickType,
            label: brick.label,
            diffs: brick.diffs
        };
    }

    public tryGetBrick(id: string): PreviewBrickGlobal | null {
        try {
            return this.getBrick(id);
        } catch (e) {
            return null;
        }
    }

    protected innerCreateBoard(config: IBoardConfig): PreviewBoard {
        return new PreviewBoard(this, config);
    }

    protected innerCreateBrick(config: IBrickDataGlobal, board: PreviewBoard): PreviewBrickGlobal {

        const brickConfig = this.getBrickConfig(config.type);

        return new PreviewBrick(this, board, {
            config: brickConfig,
            data: config,
            scheduler: new EditorScheduler({
                env: 'editor',
                brickConfig
            })
        });
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PreviewTemplate extends Emitter<IPreviewTemplateEvent> {
}

Emitter.mixin(PreviewTemplate);
