/**
 * @file types
 */

export interface IRGB {
    r: number;
    g: number;
    b: number;
}

export interface IRGBA extends IRGB {
    a: number;
}

/**
 * 饱和度和亮度位置偏移
 */
export interface ISL {
    s: number;
    l: number;
}

export interface IHSL extends ISL {
    h: number;
}

export interface IHSLA extends IHSL {
    a: number;
}
