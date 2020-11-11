/**
 * @file sort
 */
import {CommandType, Editor, ISortCommand} from '@chief-editor/core';
import {addBrick, removeBrick, resetAddBrick, resetRemoveBrick} from '../board/board';

export function sort(data: ISortCommand, editor: Editor): [boolean, ISortCommand] {
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

export function resetSort(data: ISortCommand, editor: Editor): boolean {
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
    execute: sort,
    reset: resetSort
};
