/**
 * @file type 类型定义
 */

/**
 * 位置偏移
 */
export interface IOffset {
    x: number;
    y: number;
}

/**
 * 元素大小
 *
 */
export interface IElementSize {
    width: number;
    height: number;
}

export interface IElementPosition extends IElementSize {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface IOverFlowBoundaries {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

export interface IElementPositionCaptureOptions {
    disabledCaptureWindowSize?: boolean;
    disabledCaptureContainerScroll?: boolean;
    disabledCaptureElementSizeChange?: boolean;
    disabledCaptureElementUpdate?: boolean;
    disabledCaptureTransition?: boolean;
    disabledCaptureAnimation?: boolean;
    disabledCaptureStickyCheck?: boolean;
}
