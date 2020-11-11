/**
 * @file LayerSort
 */
import {CommandType, ISortCommand, MoveType} from '../../types';
import {LayerBoard} from '../LayerBoard';
import {EditorTemplate} from '../EditorTemplate';
import {EditorBrickGlobal} from '../EditorBrick';

export class LayerSort {

    private readonly board: LayerBoard;

    constructor(board: LayerBoard) {
        this.board = board;
    }

    /**
     * 成组
     */
    public sort(type: MoveType): ISortCommand | null {
        const bricks = this.getOwnerTemplate().getActiveBricks();

        if (!bricks.length) {
            return null;
        }

        switch (type) {
            case MoveType.FRONT:
                return this.moveFront(bricks);
            case MoveType.BACK:
                return this.moveBack(bricks);
            case MoveType.HIGHEST:
                return this.moveTopest(bricks);
            case MoveType.LOWEST:
                return this.moveLowest(bricks);
        }
    }

    /**
     * 上移一层
     * @param bricks
     */
    private moveFront(bricks: EditorBrickGlobal[], index?: number): ISortCommand {
        const sortBricks = bricks.sort((a: EditorBrickGlobal, b: EditorBrickGlobal) =>
            b.getNodeIndex() - a.getNodeIndex()
        );

        // 上移一层指的是移动到当前选中图层中最高一层 +1 的后面，故 +2
        const targetIndex = index != null ? index : sortBricks[0].getNodeIndex() + 2;

        const removeOptions = sortBricks.map(brick => {
            return {
                brickId: brick.id,
                boardId: this.board.id,
                fromIndex: brick.getNodeIndex(),
                brickData: brick.getBrickData()
            };
        });

        return {
            name: CommandType.SORT,
            templateId: this.getOwnerTemplate().id,
            createOptions: {
                index: targetIndex - sortBricks.length,
                // 正序添加
                bricks: sortBricks.reverse().map(brick => brick.getBrickData()),
                boardId: this.board.id
            },
            // 倒序删除
            removeOptions
        };
    }

    /**
     * 下移一层
     * @param bricks
     */
    private moveBack(bricks: EditorBrickGlobal[], index?: number): ISortCommand {
        const sortBricks = bricks.sort((a: EditorBrickGlobal, b: EditorBrickGlobal) =>
            a.getNodeIndex() - b.getNodeIndex()
        );

        // 下移一层指的是移动到当前选中图层中最低一层 -1 的前面，因add操作是insertBefore 故 -1 即可
        let targetIndex = index != null ? index : sortBricks[0].getNodeIndex() - 1;

        if (targetIndex === -1) {
            targetIndex = 0;
        }

        return {
            name: CommandType.SORT,
            templateId: this.getOwnerTemplate().id,
            createOptions: {
                index: targetIndex,
                // 正序添加
                bricks: sortBricks.map(brick => brick.getBrickData()),
                boardId: this.board.id
            },
            // 倒序删除
            removeOptions: sortBricks.reverse().map(brick => {
                return {
                    brickId: brick.id,
                    boardId: this.board.id,
                    fromIndex: brick.getNodeIndex(),
                    brickData: brick.getBrickData()
                };
            })
        };
    }

    private moveTopest(bricks: EditorBrickGlobal[]): ISortCommand {
        return this.moveFront(bricks, this.board.getBricks().length);
    }

    private moveLowest(bricks: EditorBrickGlobal[]): ISortCommand {
        return this.moveBack(bricks, 0);
    }

    private getOwnerTemplate(): EditorTemplate {
        return this.board.getOwnerTemplate();
    }
}
