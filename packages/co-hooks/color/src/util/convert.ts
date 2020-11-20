/**
 * @file hex ,#333 #999999
 */
import {padding} from '@co-hooks/util';
import {IHSL, IHSLA, IRGB, IRGBA} from './types';

// [0,n]->[0,1]
export function toPercent(v: number, n: number = 255): number {

    v = Math.min(n, Math.max(0, v));

    if ((Math.abs(v - n) < 0.000001)) {
        return 1;
    }
    return v / n;
}

function toHex(n: number): string {
    return padding(Math.round(n).toString(16), 2);
}

function fromHex(str: string): number {
    return parseInt(str, 16);
}

export function RGB2HEX(rgb: IRGB, allowShort: boolean = false): string {

    let hex = [toHex(rgb.r), toHex(rgb.g), toHex(rgb.b)];

    if (allowShort && hex.every(item => item.charAt(0) === item.charAt(1))) {
        hex = hex.map(item => item.charAt(0));
    }

    return '#' + hex.join('').toUpperCase();
}

// support:
// #000(short)、#000000、#0000、#00000000
function HEX2RGBA(hex: string): IRGBA | null {

    if (hex.length === 3) {
        hex = hex + 'f';
    }

    if (hex.length === 4) {
        hex = hex.split('').map(item => item + item).join('');
    }

    if (hex.length === 6) {
        hex = hex + 'ff';
    }

    // 经过上面的处理必须为8位的16进制
    if (!/^[0-9a-f]{8}/.test(hex)) {
        return null;
    }

    return {
        r: fromHex(hex.slice(0, 2)),
        g: fromHex(hex.slice(2, 4)),
        b: fromHex(hex.slice(4, 6)),
        a: toPercent(fromHex(hex.slice(6))) * 100
    };
}

// support:
// #000(short)、#000000、#0000、#00000000
// rgb(29,2,210)
// rgba(20,203,20,0.1)
// hsl(100,99,88)
// hsla(230,38%,39%,0.4)
export function string2RGB(str: string): IRGBA | null {

    str = str.trim().toLowerCase();

    if (str.charAt(0) === '#') {
        return HEX2RGBA(str.slice(1));
    }

    // 处理hsla等，不是太严格，不过可以用
    if (/^(hsla?|rgba?)\s*\((.+)\)\s*$/.test(str)) {
        const hasAlpha = RegExp.$1.length > 3;
        const type = hasAlpha ? RegExp.$1.slice(0, -1) : RegExp.$1;
        const content = RegExp.$2.trim().split(/,\s*/g).map(item => parseFloat(item.trim()));
        const a = hasAlpha && content[3] != null && isFinite(content[3]) ? content[3] * 100 : 100;

        if (type === 'hsl') {
            return {
                ...HSL2RGB({
                    h: content[0] || 0,
                    s: content[1] || 0,
                    l: content[2] || 0
                }),
                a
            };
        }

        return {
            r: content[0] || 0,
            g: content[1] || 0,
            b: content[2] || 0,
            a
        };
    }

    return null;
}

// support:
// #000(short)、#000000、#0000、#00000000
// rgb(29,2,210)
// rgba(20,203,20,0.1)
// hsl(100,99,88)
// hsla(230,38%,39%,0.4)
export function parseColorStr(str: string): [IRGBA | IHSLA, 'rgb' | 'hsl'] | null {

    str = str.trim().toLowerCase();

    if (str.charAt(0) === '#') {
        const val = HEX2RGBA(str.slice(1));
        return val ? [val, 'rgb'] : val;
    }

    // 处理hsla等，不是太严格，不过可以用
    if (/^(hsla?|rgba?)\s*\((.+)\)\s*$/.test(str)) {
        const hasAlpha = RegExp.$1.length > 3;
        const type = hasAlpha ? RegExp.$1.slice(0, -1) : RegExp.$1;
        const content = RegExp.$2.trim().split(/,\s*/g).map(item => parseFloat(item.trim()));
        const a = hasAlpha && content[3] != null && isFinite(content[3]) ? content[3] * 100 : 100;

        if (type === 'hsl') {
            return [{
                h: content[0] || 0,
                s: content[1] || 0,
                l: content[2] || 0,
                a
            }, 'hsl'];
        }

        return [{
            r: content[0] || 0,
            g: content[1] || 0,
            b: content[2] || 0,
            a
        }, 'rgb'];
    }

    return null;
}

export function RGBA2HEX(rgba: IRGBA, allowShort: boolean = false): string {
    let hex = [toHex(rgba.r), toHex(rgba.g), toHex(rgba.b), toHex(rgba.a / 100 * 255)];

    if (allowShort && hex.every(item => item.charAt(0) === item.charAt(1))) {
        hex = hex.map(item => item.charAt(0));
    }
    return '#' + hex.join('').toUpperCase();
}

function hue2RGB(p: number, q: number, t: number): number {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}

export function RGB2HSL(rgb: IRGB): IHSL {
    let r = toPercent(rgb.r);
    let g = toPercent(rgb.g);
    let b = toPercent(rgb.b);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max === min) {
        h = 0;
        s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

export function HSL2RGB(hsl: IHSL): IRGB {

    let h = toPercent(hsl.h, 360);
    let s = toPercent(hsl.s, 100);
    let l = toPercent(hsl.l, 100);

    if (s === 0) {
        return {r: l * 255, g: l * 255, b: l * 255};
    }
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    let r = hue2RGB(p, q, h + 1 / 3);
    let g = hue2RGB(p, q, h);
    let b = hue2RGB(p, q, h - 1 / 3);

    return {r: r * 255, g: g * 255, b: b * 255};
}
