/**
 * @file Template
 */

import {IElementPosition, IElementSize, getDefaultElementPosition} from '@co-hooks/dom';
import {Emitter} from '@co-hooks/emitter';
import {shallowArray} from '@co-hooks/util';
import {
    BaseTemplate,
    IBoardConfig,
    IBrickDataGlobal,
    ITemplateConfig,
    NodeType
} from '@chief-editor/base';
import {IEditorBrickConfigGlobal} from '../types';
import {EditorScheduler} from './EditorScheduler';
import {EditorBrick, EditorBrickGlobal} from './EditorBrick';
import {EditorBoard} from './EditorBoard';
import {Editor} from './Editor';
import {LayerBoard} from './LayerBoard';
import {StreamBoard} from './StreamBoard';
import {History} from './History';
import {TemplateMask} from './TemplateMask';

export interface IEditorTemplateEvent {
    'active-board-change': [string];
    'active-brick-change': [string[]];
    'active-change': [boolean];
    'change': [];
}

export interface IEditorTemplateConfig extends ITemplateConfig {
    isFunctionalTemplate?: boolean;
    width: number;
    height: number;
}

export class EditorTemplate extends BaseTemplate<EditorBoard, EditorBrickGlobal> {

    public readonly isFunctionalTemplate: boolean;

    protected readonly brickConfigs: Record<string, IEditorBrickConfigGlobal>;

    private readonly editor: Editor;

    private activeBoardId: string = '';

    private activeBrickIds: string[] = [];

    private readonly mask: TemplateMask;

    private position: IElementPosition = getDefaultElementPosition();

    constructor(editor: Editor, options: IEditorTemplateConfig) {

        super(options.id);
        const {board, isFunctionalTemplate = false, width, height} = options;

        this.editor = editor;
        this.brickConfigs = editor.getBrickConfigs();
        this.isFunctionalTemplate = isFunctionalTemplate;
        this.init(board);
        this.mask = new TemplateMask(this);
        this.getOwnEditor().registerTemplate(this);

        this.position = {
            ...this.position,
            width,
            height
        };
    }

    public getHistory(): History {
        return this.editor.getHistory();
    }

    public getMask(): TemplateMask {
        return this.mask;
    }

    public setActiveBoardId(boardId: string | null, isSilent: boolean = false): void {

        const rootBoardId = this.getRootBoard().id;

        if (!boardId) {
            boardId = rootBoardId;
        }

        if (this.activeBoardId !== boardId) {
            const oldId = this.activeBoardId;
            this.activeBoardId = boardId;

            if (oldId) {
                this.getBoard(oldId).emitActiveChange();
            }

            const activeBoard = this.getActiveBoard();

            if (activeBoard) {
                activeBoard.emitActiveChange();
                // 切换board时，清空activeBrickIds
                this.setActiveBrickIds([], isSilent);
            }

            if (!isSilent) {
                this.emit('active-board-change', this.activeBoardId);
                this.getOwnEditor().updateActiveBoard(this.activeBoardId);
            }
        }
    }

    public getActiveBoardId(): string {
        return this.activeBoardId;
    }

    public getActiveBoard(): EditorBoard | null {
        return this.boardMap[this.activeBoardId] || null;
    }

    public getActiveBrickIds(): string[] {
        return this.activeBrickIds;
    }

    public getActiveBricks(): EditorBrickGlobal[] {
        return this.activeBrickIds.map(id => this.brickMap[id]).filter(brick => !!brick);
    }

    public getOwnEditor(): Editor {
        return this.editor;
    }

    public isActiveTemplate(): boolean {
        return this.editor.getActiveTemplateId() === this.id;
    }

    public setActive(): void {
        this.editor.setActiveTemplateId(this.id);
    }

    /**
     * 设置激活brick
     */
    public setActiveBrickIds(brickIds: string[], isSilent: boolean = false): void {

        if (shallowArray(brickIds, this.activeBrickIds)) {
            return;
        }

        this.activeBrickIds = brickIds;

        this.repaintMask();

        if (!isSilent) {
            this.emit('active-brick-change', this.activeBrickIds);
            this.getOwnEditor().updateActiveBricks(this.activeBrickIds);
        }
    }

    public setPosition(pos: IElementPosition): void {
        this.position = {
            ...this.position,
            left: pos.left,
            top: pos.top
        };

        this.repaintMask();
    }

    public setSize(size: IElementSize): void {
        this.position = {
            ...this.position,
            ...size
        };

        this.repaintMask();
    }

    public getPosition(): IElementPosition {
        return this.position;
    }

    public emitActiveChange(): void {
        this.emit('active-change', this.isActiveTemplate());
    }

    public emitChange(): void {
        this.emit('change');
        this.getOwnEditor().emitEditorChange();
    }

    public getBrickConfig(type: string): IEditorBrickConfigGlobal {
        return this.brickConfigs[type];
    }

    public repaintMask(): void {
        this.mask.repaintMask();
    }

    public getElementByBrickId(brickId: string): HTMLElement | null {
        return null;
    }

    public getTemplateData(cleanId: boolean = false): IEditorTemplateConfig {
        const data = super.getTemplateData(cleanId);

        Object.assign(data, {
            width: this.position.width,
            height: this.position.height
        });

        return data as IEditorTemplateConfig;
    }

    public dispose(): void {
        super.dispose();

        this.editor.unregisterTemplate(this);
    }

    protected innerCreateBoard(config: IBoardConfig): EditorBoard {
        return config.type === NodeType.STREAM ? new StreamBoard(this, config) : new LayerBoard(this, config);
    }

    protected innerCreateBrick(config: IBrickDataGlobal, board: EditorBoard): EditorBrickGlobal {

        const brickConfig = this.getBrickConfig(config.type);

        return new EditorBrick(this, board, {
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
export interface EditorTemplate extends Emitter<IEditorTemplateEvent> {

}

Emitter.mixin(EditorTemplate);
