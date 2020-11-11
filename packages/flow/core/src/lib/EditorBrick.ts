/**
 * @file Brick
 */
import {
    IBoardNodeType,
    IBrickData,
    INodeType,
    IPositionHorizontal,
    IPositionVertical,
    NodeType
} from '@chief-editor/base';
import {ILayoutConfig} from '@chief-editor/types';
import {getDefaultElementPosition, IElementPosition} from '@co-hooks/dom';
import {DomNode} from '@co-hooks/dom-node';
import {Vector} from '@co-hooks/vector';
import {CommandType, IEditorBrickPosInfo, RemoveBrickType} from '../types';
import {EditableBaseBrick, IEditorBrickInstanceOptions} from './EditableBaseBrick';
import {Editor} from './Editor';
import {EditorBoard} from './EditorBoard';
import {EditorTemplate} from './EditorTemplate';
import {History} from './History';

export class EditorBrick<V, DS, DP, CG, ST> extends EditableBaseBrick<V, DS, DP, CG, ST> {

    protected board: EditorBoard;

    protected template: EditorTemplate;

    constructor(
        template: EditorTemplate,
        board: EditorBoard,
        options: Omit<IEditorBrickInstanceOptions<V, DS, DP, CG, ST>, 'owner'>
    ) {

        super({
            owner: template,
            data: options.data,
            config: options.config,
            scheduler: options.scheduler
        });

        this.template = template;
        this.board = board;
    }

    public setBrickLayout(layout: ILayoutConfig): void {
        super.setBrickLayout(layout);

        this.getOwnerTemplate().repaintMask();
        this.getOwnEditor().emitEditorChange();
    }

    public setData(data: IBrickData<V, DS, DP, CG, ST>): void {

        super.setData(data);

        this.getOwnerTemplate().repaintMask();
        this.getOwnEditor().emitEditorChange();
    }

    public getOwnerBoard(): EditorBoard {
        return this.template.getBoardByNode(this.getNode().parentNode as DomNode<INodeType>);
    }

    public getOwnerTemplate(): EditorTemplate {
        return this.template;
    }

    public getOwnEditor(): Editor {
        return this.getOwnerTemplate().getOwnEditor();
    }

    public getAncestorBoardIds(): string[] {
        const ids: string[] = [];

        this.getNode().getPathNodes(node => {
            const value = node.getValue();

            if (value.type === NodeType.LAYER || value.type === NodeType.STREAM) {
                ids.unshift(value.boardId);
            }

            return true;
        });

        return ids;
    }

    public getAncestorBrickIds(): string[] {
        const ids: string[] = [];

        this.getNode().getPathNodes(node => {
            const value = node.getValue();

            if (value.type === NodeType.BRICK) {
                ids.unshift(value.brickId);
            }

            return true;
        });

        return ids;
    }

    public isContainer(): boolean {
        return this.getEditorBrickConfig().isContainer || false;
    }

    public moveToDraftTemplate(): void {
        this.execCommandRemoveBrick(RemoveBrickType.DRAFT);
        this.dispose();
    }

    public copyToDraftTemplate(): void {
        this.getOwnEditor().getDraftTemplate().getRootBoard().addBrick(this.getBrickData(true));
    }

    public remove(): void {

        const template = this.getOwnerTemplate();

        // 内置的template，直接删除，不留历史记录
        if (template.isFunctionalTemplate) {
            this.dispose();
            return;
        }

        this.execCommandRemoveBrick(RemoveBrickType.STASH);
        this.dispose();
    }

    public setActive(append: boolean = false): void {

        const activeBoard = this.getOwnerTemplate().getActiveBoard();

        if (!activeBoard) {
            return;
        }

        if (this.isActiveBrick()) {
            return;
        }

        const boardType = activeBoard.type;
        const boardId = activeBoard.id;
        const pathId = this.getNodePath().map(item => item.id);

        if (boardType === NodeType.STREAM) {

            if (pathId.indexOf(boardId) < 0) {
                return;
            }

        } else if (boardType === NodeType.LAYER) {
            if (activeBoard.getNode() !== this.getNode().parentNode) {
                return;
            }

            const newActiveIds: string[] = [this.id];

            if (append) {
                const activeBrickIds = this.getOwnerTemplate().getActiveBrickIds();
                newActiveIds.push(...activeBrickIds);
            }

            this.getOwnerTemplate().setActiveBrickIds(newActiveIds);
            return;
        }

        this.getOwnerTemplate().setActiveBrickIds([this.id]);
    }

    public getParts(): Record<string, EditorBoard> {

        const res: Record<string, EditorBoard> = {};

        Object.keys(this.parts).forEach(key => {
            res[key] = this.getOwnerTemplate().getBoardByNode(this.parts[key]);
        });

        return res;
    }

    public isActiveBrick(): boolean {
        return this.getOwnerTemplate().getActiveBrickIds().indexOf(this.id) >= 0;
    }

    public getBrickRectInfo(): IEditorBrickPosInfo {
        return this.calBrickPosition();
    }

    /**
     * 相对于template的元素位置
     */
    public getBrickAbsolutePosition(): IElementPosition {
        const {width = 0, height = 0} = this.layout;
        const offset = this.getAbsoluteVector();
        const [left, top] = offset.get();

        return {
            left,
            top,
            width,
            height,
            right: Math.floor(left + width),
            bottom: Math.floor(top + height)
        };
    }

    /**
     * 获取相对于template的位移
     */
    public getAbsoluteVector(): Vector {
        const info = this.getBrickRectInfo();
        const node = this.node.parentNode;

        if (!node || !info) {
            return new Vector();
        }

        const value = node.getValue();

        if (value.type === NodeType.LAYER || value.type === NodeType.STREAM) {
            return Vector.addVector(info.vector, this.getOwnerTemplate().getBoardByNode(node).getAbsoluteVector());
        }

        return new Vector();
    }

    // protected addPart(part: string, config: IBoardData): void {
    //     this.node.appendChild(this.createPartBoard(part, {
    //         ...config,
    //         ...this.getEditorBrickConfig().getPartBoardInfoFromBrickData(this.scheduler.getBrickData(), part)
    //     }));
    // }
    //
    // protected removePart(part: string): void {
    //     this.disposePartBoard(part);
    // }

    private getHistory(): History {
        return this.getOwnerTemplate().getHistory();
    }

    private execCommandRemoveBrick(toBoardId: RemoveBrickType): void {

        const boardNode = this.board.getNode();
        const index = boardNode.getIndex(this.node);

        this.getHistory().execCommand({
            name: CommandType.REMOVE_BRICK,
            templateId: this.template.id,
            options: [{
                brickId: this.id,
                boardId: this.board.id,
                fromIndex: index,
                toBoardId,
                brickData: this.getBrickData()
            }]
        });
    }

    private calBrickPosition(): IEditorBrickPosInfo {

        const boardId = (this.node.parentNode?.getValue() as IBoardNodeType).boardId;
        const board = this.getOwnerTemplate().getBoard(boardId);
        let boardPosition: IElementPosition = getDefaultElementPosition();

        if (board) {
            boardPosition = board.getPosition();
        }

        const {width: boxWidth, height: boxHeight} = boardPosition;

        let {
            vertical = 'top',
            horizontal = 'left',
            top = 0,
            bottom = 0,
            right = 0,
            left = 0,
            width = 0,
            height = 0,
            rotate = 0,
            skewX = 0,
            skewY = 0,
            scaleX = 1,
            scaleY = 1
        } = this.layout;

        const transform = {skewX, skewY, scaleX, scaleY, rotate};

        if (vertical === 'dock' || horizontal === 'dock') {
            if (vertical === 'dock') {
                height = boxHeight;
                top = 0;
                bottom = 0;
            }
            if (horizontal === 'dock') {
                width = boxWidth;
                left = 0;
                right = 0;
            }

            const vector = new Vector([left, top]);

            return {
                width,
                height,
                top,
                left,
                right,
                bottom,
                transform: {...transform, rotate: 0},
                vertical: vertical as unknown as IPositionVertical,
                horizontal: horizontal as unknown as IPositionHorizontal,
                vector
            };
        }

        left = horizontal === 'left'
            ? left
            : horizontal === 'center'
                ? (boxWidth - width) / 2
                : boxWidth - width - right;

        top = vertical === 'top'
            ? top
            : vertical === 'center'
                ? (boxHeight - height) / 2
                : boxHeight - height - bottom;

        const vector = new Vector([left, top]);

        return {
            width,
            height,
            top,
            left,
            right: left + width,
            bottom: top + height,
            transform,
            vertical: vertical as IPositionVertical,
            horizontal: horizontal as IPositionHorizontal,
            vector
        };
    }
}

export type EditorBrickGlobal = EditorBrick<any, any, any, any, any>;
