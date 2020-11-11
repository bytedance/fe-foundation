/**
 * @file brick interface
 */
import {IBrickDataGlobal, IPositionHorizontal, IPositionVertical, ITransform} from '@chief-editor/base';
import {IElementPosition} from '@co-hooks/dom';
import {Vector} from '@co-hooks/vector';
import {EditorBrickGlobal} from '../lib/EditorBrick';

export enum BrickDragType {
    NEW = 'new',
    EXIST = 'exist'
}

export enum OperationType {
    CREATE = 'create',
    MOVE = 'move',
    REMOVE = 'remove'
}

export interface IBrickDragDataNew {
    type: BrickDragType.NEW;
    brickDataList: IBrickDataGlobal[];
}

export interface IBrickDragDataExist {
    type: BrickDragType.EXIST;
    templateId: string;
    bricks: EditorBrickGlobal[];
}

export type IBrickDragData = IBrickDragDataNew | IBrickDragDataExist;

export interface IEditorBrickPosInfo extends IElementPosition {
    vector: Vector;
    horizontal: IPositionHorizontal;
    vertical: IPositionVertical;
    transform: ITransform;
}

export interface IEditorBrickDragInfo extends IDaltRect {
    transform: ITransform;
}

export interface IStartDragInfo extends IEditorBrickDragInfo {
    absVector: Vector;
    transformRectInfo: ITransformRectInfo;
}

export enum Direct {
    LEFT_TOP = 'leftTop',
    TOP = 'top',
    RIGHT_TOP = 'rightTop',
    LEFT = 'left',
    RIGHT = 'right',
    LEFT_BOTTOM = 'leftBottom',
    BOTTOM = 'bottom',
    RIGHT_BOTTOM = 'rightBottom'
}

export enum AngleDirect {
    LEFT_TOP = 'leftTop',
    LEFT_BOTTOM = 'leftBottom',
    RIGHT_TOP = 'rightTop',
    RIGHT_BOTTOM = 'rightBottom'
}

export enum MoveType {
    FRONT = 'front',
    BACK = 'back',
    HIGHEST = 'highest',
    LOWEST = 'lowest'
}

export interface IBrickTransformData {
    offset: Vector;
    rotate: number;
    isRotate?: boolean;
    direct?: Direct;
    ratio?: boolean;
}

export type ApplyBrickProps = Record<string, any>;

export interface ITransformRectInfo extends IEditorBrickDragInfo {
    // 相对画板的外接矩形位置关系
    offset: Vector;
    // 相对自己直接父级的位置关系
    relativeOffset: Vector;
    // 相对外接矩形四个点的向量关系
    points: Vector[];
    // 8个操作点相对自己直接父级坐标
    assistPoints: Record<Direct, Vector>;
}

export interface IGroupDragTransform {
    group: EditorBrickGlobal;
    dragInfo: IEditorBrickDragInfo;
}

export interface IRect {
    offset: Vector;
    sizeOffset: Vector;
}

export type IDaltRect = IRect;
