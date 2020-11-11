/**
 * @file board history
 */
import {
    CommandType,
    Editor,
    ICreateBrickCommand,
    IRemoveBrickCommand,
    IRemoveBrickCommandOption,
    RemoveBrickType
} from '@chief-editor/core';
import {IBrickDataGlobal} from '@chief-editor/base';
import {clone} from '@co-hooks/util';

/**
 * 添加组件
 * @param data
 * @param editor
 */
export function addBrick(data: ICreateBrickCommand, editor: Editor): [boolean, ICreateBrickCommand] {
    const {options: {boardId, index, bricks}, templateId} = data;
    const template = editor.getTemplate(templateId);

    if (!template) {
        return [false, data];
    }

    const board = template.getBoard(boardId);

    if (!board) {
        return [false, data];
    }

    const dataList: IBrickDataGlobal[] = [];
    const idList: string[] = [];

    // 新建添加
    bricks.forEach((config, i) => {
        const brick = board.addBrick(clone(config), index + i);

        if (brick) {
            dataList.push(brick.getBrickData());
            idList.push(brick.id);
        }
    });

    template.setActiveBrickIds(idList);
    template.emitChange();

    return [
        true,
        {
            ...data,
            options: {
                ...data.options,
                index,
                bricks: dataList
            }
        }
    ];
}

/**
 * 回滚添加组件
 * @param data
 * @param editor
 */
export function resetAddBrick(data: ICreateBrickCommand, editor: Editor): boolean {
    const {options: {bricks, boardId, index}, templateId} = data;

    const newBricks = clone(bricks);
    const opts = newBricks.reverse().map(brick => ({
        brickId: brick.id,
        boardId,
        fromIndex: index,
        toBoardId: RemoveBrickType.STASH
    }));

    const [success] = removeBrick({
        name: CommandType.REMOVE_BRICK,
        templateId,
        options: opts as IRemoveBrickCommandOption[]
    }, editor);

    return success;
}

/**
 * 删除组件
 * @param data
 * @param editor
 */
export function removeBrick(data: IRemoveBrickCommand, editor: Editor): [boolean, IRemoveBrickCommand] {
    const {options, templateId} = data;
    const template = editor.getTemplate(templateId);

    if (!template) {
        return [false, data];
    }

    const res = options.filter(option => {
        const {brickId, boardId, toBoardId} = option;

        const board = template.getBoard(boardId);
        const brick = template.getBrick(brickId);

        if (!brick || !board) {
            return false;
        }

        if (toBoardId === RemoveBrickType.DRAFT) {
            brick.getOwnEditor().getDraftTemplate().getRootBoard().addBrick(brick.getBrickData());
        } else if (toBoardId === RemoveBrickType.STASH) {
            brick.getOwnEditor().getStashTemplate().getRootBoard().addBrick(brick.getBrickData());
        }

        if (brick.isActiveBrick()) {
            // 清空active状态
            template.setActiveBrickIds([], true);
        }

        brick.dispose();
        return true;
    });

    template.emitChange();

    return [
        true,
        {
            ...data,
            options: res
        }
    ];
}

/**
 * 回滚删除组件
 * @param data
 * @param editor
 */
export function resetRemoveBrick(data: IRemoveBrickCommand, editor: Editor): boolean {
    const {options, templateId} = data;
    const opts = clone(options);

    const template = editor.getTemplate(templateId);

    if (!template) {
        return false;
    }

    return opts.reverse().every(opt => {
        const {brickId, boardId, fromIndex, toBoardId, brickData} = opt;

        const [success] = addBrick({
            name: CommandType.CREATE_BRICK,
            templateId,
            options: {
                boardId,
                index: fromIndex,
                bricks: [brickData]
            }
        }, editor);

        if (success) {
            let brick;

            // 还原draft & stash的brick
            if (toBoardId === RemoveBrickType.DRAFT) {
                brick = template.getOwnEditor().getDraftTemplate().getBrick(brickId);
            } else if (toBoardId === RemoveBrickType.STASH) {
                brick = template.getOwnEditor().getStashTemplate().getBrick(brickId);
            }

            if (brick) {
                brick.dispose();
            }
        }

        return success;
    });
}
