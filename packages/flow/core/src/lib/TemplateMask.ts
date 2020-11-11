/**
 * @file TemplateMask
 */
import {ITransform} from '@chief-editor/base';
import {IElementPosition, getDefaultElementPosition} from '@co-hooks/dom';
import {Emitter} from '@co-hooks/emitter';
import {getKeys} from '@co-hooks/util';
import {Vector} from '@co-hooks/vector';
import {IAuxiliaryLine, IAuxiliaryLinePos, IEditorBrickDragInfo, IEquidistanceLine} from '../types';
import {getTransformMatrix} from '../util';
import {EditorTemplate} from './EditorTemplate';

export interface ITemplateMaskEvent {
    'repaint': [];
}

export interface ITemplateMaskActiveBrickRectInfo {
    id: string;
    rect: IElementPosition;
    transform: ITransform;
    rotatePoint: Vector;
}

export type IActiveBrickRectMap = Record<string, ITemplateMaskActiveBrickRectInfo>;

export function getDefaultAuxiliaryLinePos(): IAuxiliaryLinePos {
    return {
        x: [],
        y: [],
        xPos: {},
        yPos: {}
    };
}

const ROTATE_ICON_SIZE = 12;
const ROTATE_ICON_DISTANCE = 4;

export class TemplateMask extends Emitter<ITemplateMaskEvent> {
    private readonly template: EditorTemplate;

    private auxiliaryLinePos: IAuxiliaryLinePos = getDefaultAuxiliaryLinePos();

    private auxiliaryPoints: Vector[] = [];

    private equidistance: IEquidistanceLine = {x: [], y: []};

    private groupRectPos: IEditorBrickDragInfo | null = null;

    private regionRect: IElementPosition = getDefaultElementPosition();

    private regionSelectFlag: number = 0;

    constructor(template: EditorTemplate) {
        super();

        this.template = template;
    }

    public getOwnerTemplate(): EditorTemplate {
        return this.template;
    }

    public getActiveBrickRectMap(): IActiveBrickRectMap {
        const rect: IActiveBrickRectMap = {};
        const brickIds = this.template.getActiveBrickIds();
        const zoom = this.getEditorZoom() / 100;

        brickIds.forEach(id => {
            const brick = this.template.getBrick(id);
            const info = brick.getBrickRectInfo();

            if (!info) {
                return;
            }

            const {width, height, transform} = info;
            const [left, top] = brick.getAbsoluteVector().get();

            const brickRect = {
                left: left * zoom,
                top: top * zoom,
                width: width * zoom,
                height: height * zoom,
                right: (left + width) * zoom,
                bottom: (top + height) * zoom
            };

            rect[id] = {
                id,
                rect: brickRect,
                transform,
                rotatePoint: this.getRotatePoint(brickRect, transform)
            };
        });

        return rect;
    }

    public setAuxiliaryLine(auxiliaryLine: IAuxiliaryLine, points: Vector[], isSilent: boolean = false): void {
        const xPos: Record<number, number[]> = {};
        const yPos: Record<number, number[]> = {};

        points.forEach((point: Vector) => {
            const [left, top] = point.get();

            xPos[top] = xPos[top] || [];
            xPos[top].push(left);

            yPos[left] = yPos[left] || [];
            yPos[left].push(top);
        });

        getKeys(xPos).forEach((key: number) => {
            xPos[key].sort((a, b) => a - b);
            xPos[key] = [xPos[key].shift() as number, xPos[key].pop() as number];
        });

        getKeys(yPos).forEach((key: number) => {
            yPos[key].sort((a, b) => a - b);
            yPos[key] = [yPos[key].shift() as number, yPos[key].pop() as number];
        });

        this.auxiliaryLinePos = {
            ...auxiliaryLine,
            xPos,
            yPos
        };

        this.auxiliaryPoints = points;

        !isSilent && this.repaintMask();
    }

    public getAuxiliaryLine(): IAuxiliaryLinePos {
        const res: IAuxiliaryLinePos = {
            x: [],
            y: [],
            xPos: {},
            yPos: {}
        };
        const zoom = this.getEditorZoom() / 100;

        getKeys(this.auxiliaryLinePos.xPos).forEach((pos: number) => {
            res.xPos[pos * zoom] = this.auxiliaryLinePos.xPos[pos].map(item => item * zoom);
        });

        getKeys(this.auxiliaryLinePos.yPos).forEach((pos: number) => {
            res.yPos[pos * zoom] = this.auxiliaryLinePos.yPos[pos].map(item => item * zoom);
        });

        res.x = this.auxiliaryLinePos.x.map(item => item * zoom);
        res.y = this.auxiliaryLinePos.y.map(item => item * zoom);

        return res;
    }

    public getAuxiliaryPoints(): Vector[] {
        return this.auxiliaryPoints;
    }

    public setGroupRectPos(info: IEditorBrickDragInfo | null, isSilent: boolean = false): void {
        this.groupRectPos = info;
        !isSilent && this.repaintMask();
    }

    public getGroupRectPos(): IEditorBrickDragInfo | null {
        if (!this.groupRectPos) {
            return null;
        }

        const {offset, sizeOffset, transform} = this.groupRectPos;
        const zoom = this.getEditorZoom() / 100;

        return {
            offset: Vector.clone(offset).scale(zoom),
            sizeOffset: Vector.clone(sizeOffset).scale(zoom),
            transform
        };
    }

    public setEquidistance(equidistance: IEquidistanceLine, isSilent: boolean = false): void {
        this.equidistance = equidistance;

        !isSilent && this.repaintMask();
    }

    public getEquidistance(): IEquidistanceLine {
        const zoom = this.getEditorZoom() / 100;

        const res: IEquidistanceLine = {x: [], y: []};

        getKeys(this.equidistance).forEach(key => {
            res[key] = this.equidistance[key].map(item => ({
                start: item.start * zoom,
                end: item.end * zoom,
                vPos: item.vPos * zoom
            }));
        });

        return res;
    }

    public setRegionSelect(): void {
        this.regionSelectFlag++;
    }

    public getRegionSelectFlag(): number {
        return this.regionSelectFlag;
    }

    public setRegionRect(rect: IElementPosition, isSilent: boolean = false): void {
        this.regionRect = rect;
        !isSilent && this.repaintMask();
    }

    public getRegionRect(): IElementPosition {
        return this.regionRect;
    }

    public repaintMask(): void {
        this.emit('repaint');
    }

    private getEditorZoom(): number {
        const editor = this.getOwnerTemplate().getOwnEditor();

        if (!editor) {
            return 100;
        }

        return editor.getZoom();
    }

    /**
     * 计算角度icon的位置
     * @param rect mask矩形位置
     * @param transform 元素变换
     */
    private getRotatePoint(rect: IElementPosition, transform: ITransform): Vector {
        const {left, top, right, width, height} = rect;
        const rotateCenter = new Vector([
            right + ROTATE_ICON_DISTANCE + ROTATE_ICON_SIZE / 2,
            top - ROTATE_ICON_SIZE / 2
        ]);
        const center = new Vector([left + width / 2, top + height / 2]);
        const matrix = getTransformMatrix(transform, center);

        const newCenter = matrix.mulVector(rotateCenter);

        return Vector.subVector(newCenter, new Vector([ROTATE_ICON_SIZE / 2, ROTATE_ICON_SIZE / 2]));
    }
}
