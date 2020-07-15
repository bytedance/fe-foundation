/**
 * @file ImageManage
 */

import {
    arrayBufferToBlob,
    dataURL2ArrayBuffer,
    dataURL2Blob,
    parseMeta,
    updateImageHead
} from '../utils';

export interface IImageManageOptions {
    crop?: boolean;
    quality?: number;
    allowMagnify?: boolean;
    preserveHeaders?: boolean;
}

export interface IImageInfo {
    type: string;
    width: number;
    height: number;
}

export interface IMetaDataInfo {
    exif: {
        get: (str: string) => number;
    };
    imageHead: ArrayBuffer;
}

export enum RotateDiection {
    HORIZONTAL_FLIP = 2,
    ROTATE_LEFT_180,
    VERTICAL_FLIP,
    VERTICAL_FLIP_ROTATE_RIGHT_90,
    ROTATE_RIGHT_90,
    HORIZONTAL_FLIP_ROTATE_RIGHT_90,
    ROTATE_LEFT_90
}

export enum ImageStatus {
    PREPARE = 'PREPARE',
    PENDING = 'PENDING',
    FULFILLED = 'FULFILLED',
    REJECTED = 'REJECTED'
}

export interface ICropImageResult {
    getBlob: (type?: string) => Blob | null;
    getJpgUrl: () => string | null;
    getPngUrl: () => string | null;
    getImageUrl: (type: string, quality?: number) => string | null;
}

/**
 * Image 图片处理类
 *
 * @param {boolean} crop 是否裁剪
 * @param {number} quality 图片处理质量
 * @param {boolean} allowMagnify 是否允许放大
 * @param {boolean} preserveHeaders 是否保留头信息
 */
export class ImageManage {
    public type: string = '';
    public quality: number = 90;
    public crop: boolean = false;
    public modified: boolean = false;
    public allowMagnify: boolean = false;
    public preserveHeaders: boolean = false;
    public blob: Blob | null = null;
    public meta: IMetaDataInfo | null = null;
    public img: HTMLImageElement | null = null;
    public canvas: HTMLCanvasElement | null = null;
    public status: ImageStatus = ImageStatus.PREPARE;
    private readonly resolvers: Array<() => void> = [];

    public updateImageOptions(props: IImageManageOptions): void {
        Object.assign(this, props);
    }

    /**
     * 加载图片
     *
     * @public
     * @param file
     */
    public initImage<T extends Blob>(file: T | string, type: string = 'image/jpeg'): void {
        const img = (this.img = new Image());
        img.crossOrigin = 'Anonymous';
        if (typeof file === 'string') {
            this.type = type;
            this.img.src = file;
        } else {
            this.blob = file;
            this.type = file.type;
            this.img.src = URL.createObjectURL(file);

            if (!this.meta && 'image/jpeg' === this.type) {
                parseMeta(this.blob, data => {
                    this.meta = data;
                });
            }
        }

        this.status = ImageStatus.PENDING;

        const self = this;
        img.onload = function () {
            if (self.img === this) {
                self.resolvers.slice(0).forEach(resolve => resolve());
                self.status = ImageStatus.FULFILLED;
            }
        };

        img.onerror = () => {
            this.status = ImageStatus.REJECTED;
        };
    }

    public dispose(): void {
        const canvas = this.canvas;

        if (canvas) {
            (canvas.getContext('2d') as CanvasRenderingContext2D).clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
            canvas.width = canvas.height = 0;
            this.canvas = null;
        }

        if (this.img) {
            // 释放内存。非常重要，否则释放不了image的内存。
            URL.revokeObjectURL(this.img.src);
            this.img.src
                = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D';
        }

        this.img = null;
        this.blob = null;
    }

    /**
     *
     * @param {number} width 图片宽度
     * @param {number} height 图片高度
     */
    public resize(width: number, height: number): Promise<ICropImageResult> {
        const fn = (): ICropImageResult => {
            const canvas
                = this.canvas || (this.canvas = document.createElement('canvas'));
            this.resizeImage(
                this.img as HTMLImageElement,
                canvas,
                width,
                height
            );

            this.blob = null;
            this.modified = true;
            return {
                getBlob: (type?: string) => this.getAsBlob(type),
                getJpgUrl: () => this.getJpgUrl(),
                getPngUrl: () => this.getPngUrl(),
                getImageUrl: (type: string, quality?: number) =>
                    this.getImageUrl(type, quality)
            };
        };
        return this.waitToLoad(fn);
    }

    /**
     * 图片旋转
     *
     * @param {number} angle 图片旋转角度
     */
    public rotate(angle: RotateDiection): Promise<ICropImageResult> {
        const fn = (): ICropImageResult => {
            const cvs
                = this.canvas || (this.canvas = document.createElement('canvas'));
            if (this.img) {
                const {width, height} = this.img;
                this.resizeImage(this.img, cvs, width, height, angle, true);
            }

            this.blob = null;
            this.modified = true;
            return {
                getBlob: (type?: string) => this.getAsBlob(type),
                getJpgUrl: () => this.getJpgUrl(),
                getPngUrl: () => this.getPngUrl(),
                getImageUrl: (type: string, quality?: number) =>
                    this.getImageUrl(type, quality)
            };
        };

        return this.waitToLoad(fn);
    }

    /**
     * 图片缩放
     *
     * @param {number} size 缩放倍数
     */
    public scale(size: number): Promise<ICropImageResult> {
        const fn = (): ICropImageResult => {
            const canvas
                = this.canvas || (this.canvas = document.createElement('canvas'));

            if (this.img) {
                const {width: naturalWidth, height: naturalHeight} = this.img;
                const w = naturalWidth * size;
                const h = naturalHeight * size;

                canvas.width = w;
                canvas.height = h;
                this.renderImageToCanvas(canvas, this.img, 0, 0, w, h);
            }

            this.blob = null;
            this.modified = true;
            return {
                getBlob: (type?: string) => this.getAsBlob(type),
                getJpgUrl: () => this.getJpgUrl(),
                getPngUrl: () => this.getPngUrl(),
                getImageUrl: (type: string, quality?: number) =>
                    this.getImageUrl(type, quality)
            };
        };

        return this.waitToLoad(fn);
    }

    /**
     * 图片裁剪
     *
     * @param {number} startX
     * @param {number} startY
     * @param {number} width
     * @param {number} height
     */
    public cropImage(
        startX: number,
        startY: number,
        width: number,
        height: number,
        clipWidth?: number,
        clipHeight?: number
    ): Promise<ICropImageResult> {
        const fn = (): ICropImageResult => {
            const canvas
                = this.canvas || (this.canvas = document.createElement('canvas'));
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
            const canvasCopy = document.createElement('canvas');
            const copyContext = canvasCopy.getContext('2d');

            if (this.img) {
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(
                    this.img,
                    startX,
                    startY,
                    width,
                    height,
                    0,
                    0,
                    width,
                    height
                );
            }

            if (clipWidth && clipHeight) {
                canvasCopy.width = clipWidth;
                canvasCopy.height = clipHeight;
                copyContext?.drawImage(canvas, 0, 0, clipWidth, clipHeight);
                this.canvas = canvasCopy;
            }

            this.blob = null;
            this.modified = true;
            return {
                getBlob: (type?: string) => this.getAsBlob(type),
                getJpgUrl: () => this.getJpgUrl(),
                getPngUrl: () => this.getPngUrl(),
                getImageUrl: (type: string, quality?: number) =>
                    this.getImageUrl(type, quality)
            };
        };

        return this.waitToLoad(fn);
    }

    private waitToLoad<T extends() => any>(fn: T): Promise<ReturnType<T>> {
        return new Promise((resolve, reject) => {
            switch (this.status) {
                case ImageStatus.PREPARE:
                    reject('请先初始化图片!');
                    break;
                case ImageStatus.REJECTED:
                    reject('图片加载失败!');
                    break;
                case ImageStatus.PENDING:
                    this.resolvers.push(() => resolve(fn()));
                    break;
                case ImageStatus.FULFILLED:
                    resolve(fn());
                    break;
            }
        });
    }

    /**
     * 获取图片url
     *
     * @public
     * @param {string} type mimetype
     * @return {string}
     */
    private getImageUrl(type: string, quality?: number): string | null {
        return (
            this.canvas
            && this.canvas.toDataURL(
                type,
                (quality ? quality : this.quality) / 100
            )
        );
    }

    /**
     * getPngUrl
     *
     * @param { number } quality 图片质量
     */
    private getPngUrl(quality?: number): string | null {
        return this.getImageUrl('image/png', quality ? quality : this.quality);
    }

    /**
     * getJpgUrl
     *
     * @param { number } quality 图片质量
     */
    private getJpgUrl(quality?: number): string | null {
        return this.getImageUrl('image/jpeg', quality ? quality : this.quality);
    }

    /**
     * 获取图片为一个二进制对象
     *
     * @public
     * @param {string} type mimetype
     * @return {Blob}
     */
    private getAsBlob(type?: string): Blob | null {
        type = type ? type : this.type;
        let blob = this.blob;
        let dataUrl = '';

        // blob需要重新生成。
        if (this.modified || this.type !== type) {
            const canvas = this.canvas as HTMLCanvasElement;
            if (type === 'image/jpeg') {
                dataUrl = canvas.toDataURL(type || this.type);

                if (this.preserveHeaders && this.meta && this.meta.imageHead) {
                    const $buffer = dataURL2ArrayBuffer(dataUrl);
                    const $bufferHead = updateImageHead(
                        $buffer,
                        this.meta.imageHead
                    );

                    return arrayBufferToBlob($bufferHead, type);
                }
            } else {
                dataUrl = canvas.toDataURL();
            }

            blob = dataURL2Blob(dataUrl);
        }

        return blob;
    }

    private resizeImage(
        img: HTMLImageElement,
        cvs: HTMLCanvasElement,
        width: number,
        height: number,
        orientationType?: RotateDiection,
        isRotate?: boolean
    ): void {
        const {width: naturalWidth, height: naturalHeight} = img;
        const orientation = orientationType || this.getOrientation();

        // values that require 90 degree rotation
        // tslint:disable-next-line
        if (~[5, 6, 7, 8].indexOf(orientation)) {
            // 交换width, height的值。
            width ^= height; // tslint:disable-line
            height ^= width; // tslint:disable-line
            width ^= height; // tslint:disable-line
        }

        let scale = Math[this.crop ? 'max' : 'min'](
            height / naturalWidth,
            width / naturalHeight
        );
        this.allowMagnify || (scale = Math.min(1, scale));

        const w = naturalWidth * scale;
        const h = naturalHeight * scale;

        if (this.crop) {
            cvs.width = width;
            cvs.height = height;
        } else {
            cvs.width = w;
            cvs.height = h;
        }

        const x = (cvs.width - w) / 2;
        const y = (cvs.height - h) / 2;

        if (isRotate || this.preserveHeaders) {
            this.rotate2Orientaion(cvs, orientation);
        }
        this.renderImageToCanvas(cvs, img, x, y, w, h);
    }

    private getOrientation(): number {
        return (
            (this.meta
                && this.meta.exif
                && this.meta.exif.get('Orientation'))
            || 1
        );
    }

    private rotate2Orientaion(canvas: HTMLCanvasElement, orientation: number): void {
        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        switch (orientation) {
            case RotateDiection.VERTICAL_FLIP_ROTATE_RIGHT_90:
            case RotateDiection.ROTATE_RIGHT_90:
            case RotateDiection.HORIZONTAL_FLIP_ROTATE_RIGHT_90:
            case RotateDiection.ROTATE_LEFT_90:
                canvas.width = height;
                canvas.height = width;
                break;
        }

        switch (orientation) {
            case RotateDiection.HORIZONTAL_FLIP: // horizontal flip
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
                break;

            case RotateDiection.ROTATE_LEFT_180: // 180 rotate left
                ctx.translate(width, height);
                ctx.rotate(Math.PI);
                break;

            case RotateDiection.VERTICAL_FLIP: // vertical flip
                ctx.translate(0, height);
                ctx.scale(1, -1);
                break;

            case RotateDiection.VERTICAL_FLIP_ROTATE_RIGHT_90: // vertical flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.scale(1, -1);
                break;

            case RotateDiection.ROTATE_RIGHT_90: // 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(0, -height);
                break;

            case RotateDiection.HORIZONTAL_FLIP_ROTATE_RIGHT_90: // horizontal flip + 90 rotate right
                ctx.rotate(0.5 * Math.PI);
                ctx.translate(width, -height);
                ctx.scale(-1, 1);
                break;

            case RotateDiection.ROTATE_LEFT_90: // 90 rotate left
                ctx.rotate(-0.5 * Math.PI);
                ctx.translate(-width, 0);
                break;
        }
    }

    private renderImageToCanvas(
        canvas: HTMLCanvasElement,
        img: HTMLImageElement,
        x: number,
        y: number,
        w: number,
        h: number
    ): void {
        const ctx = canvas.getContext('2d');
        ctx && ctx.drawImage(img, x, y, w, h);
    }
}
