/**
 * @file Canvas 画布类
 */

import {Emitter} from '@co-hooks/emitter';

/**
 * 最小缩放比例
 *
 * @type {number}
 */
const MIN_ZOOM_PERCENT = 50;

/**
 * 最大缩放比例
 *
 * @type {number}
 */
const MAX_ZOOM_PERCENT = 200;

export interface ICanvasEvent {
    'position-change': [ICanvasPosition];
}

export interface ICanvasPosition {
    x: number;
    y: number;
    zoom: number;
}

export function getDefaultCanvasPosition(zoom: number): ICanvasPosition {
    return {
        x: 0,
        y: 0,
        zoom
    };
}

export interface ICanvasConfig {
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
}

export class Canvas extends Emitter<ICanvasEvent> {

    private position: ICanvasPosition;

    private minZoom: number = MIN_ZOOM_PERCENT;

    private maxZoom: number = MAX_ZOOM_PERCENT;

    private zoomStep: number = 10;

    /**
     * 构造函数
     *
     * @constructor
     * @param {number} defaultZoom 默认zoom
     * @param {ICanvasConfig} config canvas配置
     */
    constructor(defaultZoom: number, config: ICanvasConfig) {

        super();

        this.position = getDefaultCanvasPosition(defaultZoom || 100);
        this.updateCanvasConfig(config);
    }

    public updateCanvasConfig(config: ICanvasConfig): void {
        const {minZoom = MIN_ZOOM_PERCENT, maxZoom = MAX_ZOOM_PERCENT, zoomStep = 10} = config;

        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.zoomStep = zoomStep;
    }

    /**
     * 设置画板位置
     *
     * @public
     */
    public setCanvasPosition(pos: Partial<ICanvasPosition>): void {
        let {x, y, zoom} = pos;
        let oldPosition = this.getCanvasPosition();

        if (x == null) {
            x = oldPosition.x;
        }

        if (y == null) {
            y = oldPosition.y;
        }

        if (zoom == null) {
            zoom = oldPosition.zoom;
        }

        zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));

        this.position = {
            x,
            y,
            zoom
        };

        this.emitPositionChange();
    }

    /**
     * 获取画布位置信息
     *
     * @public
     * @return {Object}
     */
    public getCanvasPosition(): ICanvasPosition {

        return this.position;
    }

    /**
     * 放大
     *
     * @public
     */
    public increaseZoom(): void {

        let position = this.getCanvasPosition();

        this.setCanvasPosition({
            zoom: position.zoom + this.zoomStep
        });

    }

    /**
     * 缩小
     *
     * @public
     */
    public decreaseZoom(): void {
        let position = this.getCanvasPosition();

        this.setCanvasPosition({
            zoom: position.zoom - this.zoomStep
        });
    }

    public setZoom(zoom: number): void {
        this.position.zoom = zoom;

        this.emitPositionChange();
    }

    public getZoom(): number {
        return this.position.zoom;
    }

    /**
     * 移动画布
     *
     * @public
     * @param {number} deltaX 水平位移
     * @param {number} deltaY 数值位移
     */
    public move(deltaX: number, deltaY: number): void {

        let position = this.getCanvasPosition();

        this.setCanvasPosition({
            x: position.x + deltaX,
            y: position.y + deltaY
        });
    }

    public emitPositionChange(): void {
        this.emit('position-change', this.getCanvasPosition());
    }
}
