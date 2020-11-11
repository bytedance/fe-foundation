/**
 * @file group
 */

import {CommandType, Editor, IGroupCommand} from '@chief-editor/core';
import {addBrick, removeBrick, resetAddBrick, resetRemoveBrick} from '../board/board';

/**
 * 成组
 * @param data
 * @param editor
 */
export function group(data: IGroupCommand, editor: Editor): [boolean, IGroupCommand] {
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
 * 成组回滚
 * @param data
 * @param editor
 */
export function resetGroup(data: IGroupCommand, editor: Editor): boolean {
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
    execute: group,
    reset: resetGroup
};
