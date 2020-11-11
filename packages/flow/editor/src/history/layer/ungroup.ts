/**
 * @file ungroup
 */
import {CommandType, Editor, IUnGroupCommand} from '@chief-editor/core';
import {addBrick, removeBrick, resetAddBrick, resetRemoveBrick} from '../board/board';

/**
 * 取消成组
 * @param data
 * @param editor
 */
export function ungroup(data: IUnGroupCommand, editor: Editor): [boolean, IUnGroupCommand] {
    const {createOptions, removeOptions, templateId} = data;

    removeBrick(
        {name: CommandType.REMOVE_BRICK, templateId, options: removeOptions},
        editor
    );

    addBrick(
        {name: CommandType.CREATE_BRICK, templateId, options: createOptions},
        editor
    );

    return [true, data];
}

/**
 * 撤销取消成组
 * @param data
 * @param editor
 */
export function resetUngroup(data: IUnGroupCommand, editor: Editor): boolean {
    const {createOptions, removeOptions, templateId} = data;

    const undoCreate = resetAddBrick(
        {name: CommandType.CREATE_BRICK, templateId, options: createOptions},
        editor
    );

    const undoRemove = resetRemoveBrick(
        {name: CommandType.REMOVE_BRICK, templateId, options: removeOptions},
        editor
    );

    return undoCreate && undoRemove;
}

export default {
    execute: ungroup,
    reset: resetUngroup
};
