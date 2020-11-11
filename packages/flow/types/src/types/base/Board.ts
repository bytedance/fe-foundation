/**
 * @file Board 画板相关类型
 */
import {BoardType, FloatType, IDisposableNode} from './Node';
import {IBrickDataGlobal} from './Brick';

export interface IBoardInfo {
    type: BoardType;
    floatType?: FloatType;
    accept?: string[];
    max?: number;
}

export interface IBoardData {
    id?: string;
    bricks: IBrickDataGlobal[];
}

export interface IBoardConfig extends IBoardInfo, IBoardData {
}

export interface IBoardInstance extends IDisposableNode {

    readonly floatType: FloatType;

    readonly type: BoardType;

    init(): void;

    getBoardData(cleanId?: boolean): IBoardConfig;
}
