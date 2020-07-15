/**
 * @file Color 颜色转化和处理
 */

import {Emitter} from '@co-hooks/emitter';
import {Color, IColorInfoOptions} from './Color';

export interface IColorEvents {
    change: [Color];
    repaint: [];
}

export interface IColorOptions extends IColorInfoOptions {
    value: string;
}

export class ColorManager extends Emitter<IColorEvents> {

    private hasAlpha: boolean = false;
    private format: 'rgb' | 'hex' | 'hsl' = 'rgb';
    private value: string = '';
    private color: Color = Color.fromEmpty({});

    public updateOptions(options: IColorOptions): void {

        const {value, hasAlpha = false, format = 'rgb'} = options;

        // 值不相同再更新
        if (value !== this.value || hasAlpha !== this.hasAlpha || format !== this.format) {

            this.hasAlpha = hasAlpha;
            this.format = format;
            this.value = value;

            this.color = Color.fromString(value, {
                hasAlpha,
                format
            });
            this.emit('repaint');
        }
    }

    public getColor(): Color {
        return this.color;
    }

    public setColor(color: Color): void {
        this.color = color;
    }

    // 刷新组件
    public emitColorChange(color: Color): void {
        this.emit('change', color);
    }
}
