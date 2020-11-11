/**
 * @file mask
 */

import {IElementPosition} from '@co-hooks/dom';
import {Vector} from '@co-hooks/vector';
import {ApplyBrickProps} from './Brick';
import {ISetBrickCommandOption} from './Command';

export interface IAuxiliaryLine {
    x: number[];
    y: number[];
}

export interface IAuxiliaryLinePos extends IAuxiliaryLine {
    xPos: Record<number, number[]>;
    yPos: Record<number, number[]>;
}

export interface IEquidistanceLine {
    x: IEquidistanceLineItem[];
    y: IEquidistanceLineItem[];
}

export interface IEquidistanceLineItem {
    start: number;
    end: number;
    vPos: number;
}

export interface IEquidistanceDataInfo {
    min: number;
    max: number;
    vMin: number;
    vMax: number;
}

export interface ILayerMarkDragResult {
    [key: string]: {
        props: ApplyBrickProps;
        oldProps: ApplyBrickProps;
        commandOption: ISetBrickCommandOption | null;
    };
}

export interface IAdsorptionList {
    start: [number | null, boolean];
    center: [number | null, boolean];
    end: [number | null, boolean];
}

export enum AlignDirection {
    TOP = 'top',
    BOTTOM = 'bottom',
    V_CENTER = 'v_center',
    LEFT = 'left',
    RIGHT = 'right',
    H_CENTER = 'h_center'
}

export interface IRefWrapBrickPosition extends IElementPosition {
    points: Vector[];
}
