/**
 * @file index
 */
import {IHistoryExecute} from '@chief-editor/core';
import createBrick from './board/createBrick';
import moveBrick from './board/moveBrick';
import removeBrick from './board/removeBrick';
import setBrick from './brick/setBrick';
import setBrickData from './brick/setBrickData';
import group from './layer/group';
import ungroup from './layer/ungroup';
import sort from './layer/sort';
import {boardHistoryRegisterFunction} from './board';
import {brickHistoryRegisterFunction} from './brick';
import {layerHistoryRegisterFunction} from './layer';

export {
    createBrick,
    moveBrick,
    removeBrick,
    setBrick,
    setBrickData,
    group,
    ungroup,
    sort
};

export const historyFunctionList: Record<string, Record<string, IHistoryExecute<any, any>>> = {
    board: boardHistoryRegisterFunction,
    brick: brickHistoryRegisterFunction,
    layer: layerHistoryRegisterFunction
};

