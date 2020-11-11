/**
 * @file command type
 */
import {IBrickDataGlobal} from '@chief-editor/base';

export enum CommandType {
    'CREATE_BRICK' = 'createBrick',
    'MOVE_BRICK' = 'moveBrick',
    'REMOVE_BRICK' = 'removeBrick',
    'SET_BRICK' = 'setBrick',
    'SET_BRICK_DATA' = 'setBrickData',
    'REPLACE_BRICK' = 'replaceBrick',
    'GROUP' = 'group',
    'UNGROUP' = 'ungroup',
    'SORT' = 'sort'
}

export enum RemoveBrickType {
    STASH = 'stash',
    DRAFT = 'draft'
}

export interface ICreateBrickCommandOption {
    bricks: IBrickDataGlobal[];
    boardId: string;
    index: number;
}

export interface IMoveBrickCommandOption {
    brickId: string;
    boardId: string;
    index: number;
    fromBoardId: string;
    fromIndex: number;
}

export interface IRemoveBrickCommandOption {
    brickId: string;
    boardId: string;
    fromIndex: number;
    toBoardId?: RemoveBrickType;
    brickData: IBrickDataGlobal;
}

export interface ISetBrickCommandOption {
    brickId: string;
    props: ISetBrickProp[];
}

export interface ISetBrickDataCommandOption {
    brickId: string;
    data: IBrickDataGlobal;
    oldData: IBrickDataGlobal;
}

export interface ISetBrickProp {
    key: string;
    oldValue: any;
    value: any;
}

export interface IReplaceBrickCommand {
    name: CommandType.REPLACE_BRICK;
    templateId: string;
    createOptions: ICreateBrickCommandOption;
    removeOptions: IRemoveBrickCommandOption[];
}

export interface IGroupCommand {
    name: CommandType.GROUP;
    templateId: string;
    createOptions: ICreateBrickCommandOption;
    removeOptions: IRemoveBrickCommandOption[];
}

export interface IUnGroupCommand {
    name: CommandType.UNGROUP;
    templateId: string;
    createOptions: ICreateBrickCommandOption;
    removeOptions: IRemoveBrickCommandOption[];
}

export interface ISortCommand {
    name: CommandType.SORT;
    templateId: string;
    createOptions: ICreateBrickCommandOption;
    removeOptions: IRemoveBrickCommandOption[];
}

export interface ICreateBrickCommand {
    name: CommandType.CREATE_BRICK;
    templateId: string;
    options: ICreateBrickCommandOption;
}

export interface IMoveBrickCommand {
    name: CommandType.MOVE_BRICK;
    templateId: string;
    options: IMoveBrickCommandOption[];
}

export interface IRemoveBrickCommand {
    name: CommandType.REMOVE_BRICK;
    templateId: string;
    options: IRemoveBrickCommandOption[];
}

export interface ISetBrickCommand {
    name: CommandType.SET_BRICK;
    templateId: string;
    options: ISetBrickCommandOption[];
}

export interface ISetBrickDataCommand {
    name: CommandType.SET_BRICK_DATA;
    templateId: string;
    options: ISetBrickDataCommandOption[];
}

export interface ICommonCommand {
    name: string;

    [key: string]: any;
}

export type ICommand =
    | ICreateBrickCommand
    | IMoveBrickCommand
    | IRemoveBrickCommand
    | ISetBrickCommand
    | ISetBrickDataCommand
    | IReplaceBrickCommand
    | IGroupCommand
    | IUnGroupCommand
    | ISortCommand
    | ICommonCommand;
