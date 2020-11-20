/**
 * @file Color 颜色转化和处理
 */

import {HSL2RGB, IHSL, IHSLA, IRGB, IRGBA, ISL, RGB2HEX, RGB2HSL, RGBA2HEX, string2RGB, parseColorStr} from '../util';

export interface IColorInfoOptions {
    hasAlpha?: boolean;
    format?: 'rgb' | 'hex' | 'hsl';
}

export class Color {

    // 字符串 -> color对象
    public static fromEmpty(options: IColorInfoOptions): Color {
        return new Color({h: 0, s: 100, l: 50, a: 100}, options);
    }

    // 字符串 -> color对象
    public static fromString(str: string, options: IColorInfoOptions): Color {

        // const color = string2RGB(str);
        const color = parseColorStr(str);

        if (color == null) {
            return Color.fromEmpty(options);
        }

        const [data, type] = color;

        if (type === 'rgb') {
            return new Color({a: data.a, ...RGB2HSL(data as IRGBA)}, options);
        }

        return new Color(data as IHSLA, options);
    }

    // rgb -> color对象
    public static fromRGB(rgb: IRGB, options: IColorInfoOptions): Color {
        return new Color({a: 1, ...RGB2HSL(rgb)}, options);
    }

    // rgba -> color对象
    public static fromRGBA(rgba: IRGBA, options: IColorInfoOptions): Color {
        return new Color({a: rgba.a, ...RGB2HSL(rgba)}, options);
    }

    // hsl -> color对象
    public static fromHSL(hsl: IHSL, options: IColorInfoOptions): Color {
        return new Color({a: 1, ...hsl}, options);
    }

    // hsla -> color对象
    public static fromHSLA(hsla: IHSLA, options: IColorInfoOptions): Color {
        return new Color(hsla, options);
    }

    private readonly h: number = 0;
    private readonly s: number = 0;
    private readonly l: number = 0;
    private readonly a: number = 0;

    private readonly hasAlpha: boolean = false;
    private readonly format: 'rgb' | 'hex' | 'hsl' = 'rgb';

    private constructor(hsla: IHSLA, options: IColorInfoOptions) {
        Object.assign(this, hsla);
        this.hasAlpha = options.hasAlpha || false;
        this.format = options.format || 'hex';
    }

    public getOptions(): Required<IColorInfoOptions> {
        return {
            hasAlpha: this.hasAlpha,
            format: this.format
        };
    }

    public getHue(): number {
        return this.h;
    }

    public setHue(h: number): Color {
        return Color.fromHSLA({
            ...this.getHSLA(),
            h
        }, this.getOptions());
    }

    public getAlpha(): number {
        return this.a;
    }

    public setAlpha(a: number): Color {
        return Color.fromHSLA({
            ...this.getHSLA(),
            a
        }, this.getOptions());
    }

    public getSaturation(): number {
        return this.s;
    }

    public setSaturation(s: number): Color {
        return Color.fromHSLA({...this.getHSLA(), s}, this.getOptions());
    }

    public getLight(): number {
        return this.l;
    }

    public setLight(l: number): Color {
        return Color.fromHSLA({...this.getHSLA(), l}, this.getOptions());
    }

    public setSL(sl: ISL): Color {
        return Color.fromHSLA({...this.getHSLA(), ...sl}, this.getOptions());
    }

    public getRed(): number {
        return this.getRGB().r;
    }

    public setRed(r: number): Color {
        return Color.fromRGBA({...this.getRGBA(), r}, this.getOptions());
    }

    public getGreen(): number {
        return this.getRGB().g;
    }

    public setGreen(g: number): Color {
        return Color.fromRGBA({...this.getRGBA(), g}, this.getOptions());
    }

    public getBlue(): number {
        return this.getRGB().b;
    }

    public setBlue(b: number): Color {
        return Color.fromRGBA({...this.getRGBA(), b}, this.getOptions());
    }

    // rgb
    public getRGB(): IRGB {
        return HSL2RGB(this.getHSL());
    }

    public setRGB(rgb: IRGB): Color {
        return Color.fromRGBA({...rgb, a: this.a}, this.getOptions());
    }

    // rgba
    public getRGBA(): IRGBA {
        return {...this.getRGB(), a: this.a};
    }

    public setRGBA(rgba: IRGBA): Color {
        return Color.fromRGBA(rgba, this.getOptions());
    }

    // hsl
    public getHSL(): IHSL {
        return {
            h: this.h,
            s: this.s,
            l: this.l
        };
    }

    public setHSL(hsl: IHSL): Color {
        return Color.fromHSLA({...hsl, a: this.a}, this.getOptions());
    }

    // hsla
    public getHSLA(): IHSLA {
        return {h: this.h, s: this.s, l: this.l, a: this.a};
    }

    public setHSLA(hsla: IHSLA): Color {
        return Color.fromHSLA(hsla, this.getOptions());
    }

    // 设置Hex，3/4/6/8位都支持
    public trySetHex(nv: string): Color | null {

        const rgba = string2RGB(nv);

        if (rgba != null) {
            return Color.fromRGBA(rgba, this.getOptions());
        }

        return null;
    }

    // hex

    // hex
    public toHex(): string {
        return this.hasAlpha ? this.toHex8() : this.toHex6();
    }

    public toHex6(): string {
        return RGB2HEX(this.getRGB());
    }

    // hex
    public toHex8(): string {
        return RGBA2HEX(this.getRGBA());
    }

    public toRGB(): string {
        const rgb = this.getRGB();
        return `rgb(${rgb.r.toFixed(0)}, ${rgb.g.toFixed(0)}, ${rgb.b.toFixed(0)})`;
    }

    public toRGBA(): string {
        const rgb = this.getRGB();
        const a = (this.a / 100).toFixed(2);
        return `rgba(${rgb.r.toFixed(0)}, ${rgb.g.toFixed(0)}, ${rgb.b.toFixed(0)}, ${a})`;
    }

    public toHSL(): string {
        const hsl = this.getHSL();
        return `hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`;
    }

    public toHSLA(): string {
        const hsl = this.getHSL();
        const a = (this.a / 100).toFixed(2);
        return `hsla(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%, ${a})`;
    }

    public toHSLAPrecision(): string {
        const hsl = this.getHSL();
        const a = String(this.a / 100);
        return 'hsla('
            .concat(String(hsl.h), ', ')
            .concat(String(hsl.s), '%, ')
            .concat(String(hsl.l), '%, ')
            .concat(a, ')');
    }

    public toString(): string {

        const {format, hasAlpha} = this;

        if (format === 'hex') {
            return hasAlpha ? this.toHex8() : this.toHex();
        }

        if (format === 'rgb') {

            if (hasAlpha) {
                return this.toRGBA();
            }

            return this.toRGB();
        }

        if (hasAlpha) {
            return this.toHSLA();
        }

        return this.toHSL();
    }
}
