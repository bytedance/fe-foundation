/**
 * @file index
 */
import {CommandType} from '@chief-editor/core';
import replaceBrick from './replaceBrick';
import createBrick from './createBrick';
import moveBrick from './moveBrick';
import removeBrick from './removeBrick';

export const boardHistoryRegisterFunction = {
    [CommandType.CREATE_BRICK]: createBrick,
    [CommandType.MOVE_BRICK]: moveBrick,
    [CommandType.REMOVE_BRICK]: removeBrick,
    [CommandType.REPLACE_BRICK]: replaceBrick
};
