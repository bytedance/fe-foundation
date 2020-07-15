/**
 * @file index 枚举
 */

export enum AxisType {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical'
}

export enum PointHorizontalType {
    LEFT = 0b0010,
    CENTER = 0b0000,
    RIGHT = 0b0011
}

export enum PointVerticalType {
    TOP = 0b1000,
    CENTER = 0b0000,
    BOTTOM = 0b1100
}

export enum PointType {
    LEFT_TOP = PointHorizontalType.LEFT | PointVerticalType.TOP,
    LEFT = PointHorizontalType.LEFT | PointVerticalType.CENTER,
    LEFT_BOTTOM = PointHorizontalType.LEFT | PointVerticalType.BOTTOM,
    TOP = PointHorizontalType.CENTER | PointVerticalType.TOP,
    CENTER = PointHorizontalType.CENTER | PointVerticalType.CENTER,
    BOTTOM = PointHorizontalType.CENTER | PointVerticalType.BOTTOM,
    RIGHT_TOP = PointHorizontalType.RIGHT | PointVerticalType.TOP,
    RIGHT = PointHorizontalType.RIGHT | PointVerticalType.CENTER,
    RIGHT_BOTTOM = PointHorizontalType.RIGHT | PointVerticalType.BOTTOM,
}
