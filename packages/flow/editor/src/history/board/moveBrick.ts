/**
 * @file moveBrick
 */
import {Editor, EditorTemplate, IMoveBrickCommand, IMoveBrickCommandOption} from '@chief-editor/core';
import {clone} from '@co-hooks/util';

/**
 * 移动组件
 * @param data
 * @param editor
 * @param isSilent
 */
export function moveBrick(
    data: IMoveBrickCommand,
    editor: Editor
): [boolean, IMoveBrickCommand] {
    const {options, templateId} = data;

    const template = editor.getTemplate(templateId);

    if (!template) {
        return [false, data];
    }

    const valid = options.every(option => {
        const {brickId, boardId} = option;

        const board = template.getBoard(boardId);
        const brick = template.getBrick(brickId);

        return brick && board;
    });

    if (!valid) {
        return [false, data];
    }

    return [
        true,
        {
            ...data,
            options: options.map(option => moveBrickItem(option, template))
                .filter(item => !!item) as IMoveBrickCommandOption[]
        }
    ];
}


export function moveBrickItem(
    options: IMoveBrickCommandOption,
    template: EditorTemplate
): IMoveBrickCommandOption | null {

    const {brickId, boardId, index} = options;
    const board = template.getBoard(boardId);
    const brick = template.getBrick(brickId);

    const newIndex = board.moveBrick(board.getNode(), brick, index);

    return {
        ...options,
        index: newIndex
    };
}

/**
 * 重置移动组件
 * @param data
 * @param editor
 */
export function resetMoveBrick(data: IMoveBrickCommand, editor: Editor): boolean {
    const {options} = data;
    const opts = clone(options);
    const newOptions = opts.reverse().map(option => {
        const {brickId, boardId, fromIndex, index, fromBoardId} = option;

        return {
            brickId,
            boardId: fromBoardId,
            index: fromIndex,
            fromBoardId: boardId,
            fromIndex: index
        };
    });

    const [success] = moveBrick({
        ...data,
        options: newOptions
    }, editor);

    return success;
}

export default {
    execute: moveBrick,
    reset: resetMoveBrick
};
