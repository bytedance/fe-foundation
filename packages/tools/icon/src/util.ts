/**
 * @file util 工具函数
*/
import tinycolor from 'tinycolor2';
import csstree, {Value} from 'css-tree';

/**
 * 生成4位随机数
 */
function s4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

/**
 * 生成全局唯一标识符
 *
 * @return 返回一个guid
 */
export function guid(): string {
    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

export function camelCase(str: string, prefix: string = '-'): string {
    return str.replace(
        new RegExp('[' + prefix + ']' + '(.)', 'gi'),
        (all, letter) => letter.toUpperCase());
}

export function pascalCase(str: string, prefix: string = '-'): string {
    str = camelCase(str, prefix);
    return `${str[0].toUpperCase()}${str.slice(1)}`;
}

/**
 * 比较2个颜色是否相等
 * @param color1
 * @param color2
 */
export function isColorEqual(color1: string, color2: string): boolean {

    if (color1 === color2) {
        return true;
    }

    if (color1 === 'none' || color2 === 'none') {
        return false;
    }

    return tinycolor.equals(color1, color2);
}

interface IHsla {
    h: number;
    s: number;
    l: number;
    a: number;
}

export function color2Hsl(str: string): IHsla | null {

    const color = tinycolor(str);

    if (color.isValid()) {
        return color.toHsl();
    }

    return null;
}

export function color2Hex(obj: string): string | null {

    const color = tinycolor(obj);

    if (color.isValid()) {
        return color.toHex();
    }

    return null;
}

export function getKeys<T>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

export function replaceAnimation(str: string): string | null {
    const tokens = csstree.parse(str, {
        parseValue: true,
        context: 'value'
    }) as csstree.Value;

    const list = tokens.children.toArray();
    let hasTimingFunction = false;
    let hasCount = false;
    let hasDirection = false;
    let hasMode = false;
    let hasState = false;

    for (const item of list) {

        if (item.type === 'Function') {
            hasTimingFunction = true;
            continue;
        }

        if (item.type === 'Number') {
            hasCount = true;
            continue;
        }

        if (item.type === 'Identifier') {

            const name = item.name;

            if (!hasTimingFunction && /^(ease|ease-in|ease-out|ease-in-out|linear)$/.test(name)) {
                hasTimingFunction = true;
                continue;
            }

            if (!hasCount && name === 'infinite') {
                hasCount = true;
                continue;
            }

            if (!hasDirection && /^(normal|reverse|alternate|alternate-reverse)$/.test(name)) {
                hasDirection = true;
                continue;
            }

            if (!hasDirection && /^(normal|reverse|alternate|alternate-reverse)$/.test(name)) {
                hasDirection = true;
                continue;
            }

            if (!hasMode && /^(none|forwards|backwards|both)$/.test(name)) {
                hasMode = true;
                continue;
            }

            if (!hasState && /^(running|paused)$/.test(name)) {
                hasState = true;
                continue;
            }
            if (!/^(unset|initial|inherit|none)$/.test(name)) {
                return name;
            }
        }
    }

    return null;
}

export function splitAnimation(str: string): string[] {

    const result: string[] = [];
    let inFunction = 0;
    let current = '';

    for (const char of str) {

        if (char === ',' && !inFunction) {
            result.push(current);
            current = '';
            continue;
        }

        if (char === '(') {
            inFunction++;
        }

        if (char === ')') {
            inFunction--;
        }
        current += char;
    }
    result.push(current);

    return result;
}
