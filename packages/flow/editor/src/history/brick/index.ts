/**
 * @file index
 */
import {CommandType} from '@chief-editor/core';
import setBrick from './setBrick';
import setBrickData from './setBrickData';

export const brickHistoryRegisterFunction = {
    [CommandType.SET_BRICK]: setBrick,
    [CommandType.SET_BRICK_DATA]: setBrickData
};
