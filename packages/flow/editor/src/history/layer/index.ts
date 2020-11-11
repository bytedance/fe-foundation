/**
 * @file index
 */
import {CommandType} from '@chief-editor/core';
import group from './group';
import ungroup from './ungroup';
import sort from './sort';

export const layerHistoryRegisterFunction = {
    [CommandType.GROUP]: group,
    [CommandType.UNGROUP]: ungroup,
    [CommandType.SORT]: sort
};
