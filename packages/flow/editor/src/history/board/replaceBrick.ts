/**
 * @file replaceBrick
 */

import {CommandType, Editor, IReplaceBrickCommand} from '@chief-editor/core';
import {addBrick, removeBrick, resetAddBrick, resetRemoveBrick} from './board';

/**
 * 替换元素
 * @param data
 * @param editor
 */
export function replaceBrick(data: IReplaceBrickCommand, editor: Editor): [boolean, IReplaceBrickCommand] {
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
 * 替换回滚
 * @param data
 * @param editor
 */
export function resetReplaceBrick(data: IReplaceBrickCommand, editor: Editor): boolean {
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
    execute: replaceBrick,
    reset: resetReplaceBrick
};
