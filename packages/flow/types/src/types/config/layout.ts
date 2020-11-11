/**
 * @file layout 属性的定义
 */

export type IPositionHorizontal = 'left' | 'center' | 'right' | 'dock';

export type IPositionVertical = 'top' | 'center' | 'bottom' | 'dock';

export interface IHorizontalConfig {
    horizontal?: IPositionHorizontal;
    left?: number;
    right?: number;
}

export interface IVerticalConfig {
    vertical?: IPositionVertical;
    top?: number;
    bottom?: number;
}

export interface ITransform {
    // X横切
    skewX: number;
    // Y横切
    skewY: number;
    // X缩放 做翻转使用
    scaleX: number;
    // Y缩放 做翻转使用
    scaleY: number;
    // 旋转角度
    rotate: number;
}

export interface ISize {
    // 组件宽度
    width?: number;
    // 组件高度
    height?: number;
}

export interface ILayoutConfig extends IHorizontalConfig, IVerticalConfig, Partial<ITransform>, ISize {
    ratio?: boolean;
}
