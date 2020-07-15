/**
 * @file Carousel
 */
import {EventEmitter} from 'events';
import React, {CSSProperties, Children} from 'react';
import {getKeys} from '@co-hooks/util';
import {IElementSize, getDefaultElementSize} from '@co-hooks/dom';

export type Effect = 'slide' | 'fade' | 'cover-flow';
export type PaginationType = 'bullets' | 'progress';
export type PaginationPosition = 'left' | 'center' | 'right';
export type ArrowTheme = 'outline' | 'filled' | 'two-tone' | 'multi-color';

export interface ICarouselOptions {
    delay: number;
    speed: number;
    effect: Effect;
    autoplay: boolean;
    paginationColor: string;
    paginationActiveColor: string;
    paginationPosition: PaginationPosition;
    arrowSize: number;
    arrowTheme: ArrowTheme;
    arrowFillColor: string;
    paginationType: PaginationType;
}

export class Carousel extends EventEmitter {
    public delay: number;
    public speed: number;
    public effect: Effect;
    public arrowSize: number;
    public autoplay: boolean;
    public arrowTheme: ArrowTheme;
    public arrowFillColor: string;
    public paginationColor: string;
    public paginationActiveColor: string;
    public paginationType: PaginationType;
    public paginationPosition: PaginationPosition;

    public currentIndex: number = 0;
    public preIndex: number | null = null;
    public sliders: React.ReactNode[] = [];
    public carouselSize: IElementSize = getDefaultElementSize();
    private timeId: NodeJS.Timeout | null = null;

    constructor(options: ICarouselOptions) {
        super();
        const {
            delay,
            speed,
            effect,
            arrowSize,
            autoplay,
            arrowTheme,
            arrowFillColor,
            paginationColor,
            paginationActiveColor,
            paginationType,
            paginationPosition
        } = options;

        this.delay = delay;
        this.speed = speed;
        this.effect = effect;
        this.arrowSize = arrowSize;
        this.autoplay = autoplay;
        this.arrowSize = arrowSize;
        this.arrowTheme = arrowTheme;
        this.arrowFillColor = arrowFillColor;
        this.paginationColor = paginationColor;
        this.paginationActiveColor = paginationActiveColor;
        this.paginationType = paginationType;
        this.paginationPosition = paginationPosition;
    }

    public updateCarouselOptions(options: ICarouselOptions): void {
        getKeys(options).forEach(key => {
            const value = options[key];
            if (value !== undefined) {
                if (key === 'autoplay' && this.autoplay !== options[key]) {
                    if (options[key] === true) {
                        this.restart();
                    } else {
                        this.stop();
                    }
                }

                Object.assign(this, {
                    [key]: value
                });
            }
        });
    }

    // only for slide mode
    public getRealCurrentIndex(): number {
        if (this.effect === 'slide') {
            const sliderCount = this.sliders.length;

            if (this.currentIndex > sliderCount - 3) {
                return 0;
            }
            if (this.currentIndex < 0) {
                return sliderCount - 3;
            }
        }

        return this.currentIndex;
    }

    public slideTo(nextIndex: number, stopAnimate?: boolean): void {
        this.preIndex = this.currentIndex;
        this.currentIndex = nextIndex;
        switch (this.effect) {
            case 'slide':
                this.doSlideMode(stopAnimate);
                break;
            case 'fade':
            case 'cover-flow':
                this.doOtherMode();
                break;
            default:
                this.doOtherMode();
                break;
        }

        if (this.autoplay) {
            setTimeout(() => {
                this.startAutoplay();
            }, this.delay);
        }
        this.emit('active-index-change', this.getRealCurrentIndex());
    }

    public startAutoplay(): void {
        this.clearTimer();
        this.timeId = setTimeout(() => {
            this.slideTo(this.currentIndex + 1);
        }, this.speed);
    }

    public setCarouselSize(carouselSize: IElementSize): void {
        this.carouselSize = carouselSize;

        // param true for 'slide' effect
        this.slideTo(this.currentIndex, true);
        this.emit('carousel-size-change', carouselSize);
    }

    public cloneChild(originChild: React.ReactNode[]): void {
        const originChildCount = Children.count(originChild);
        const arr: React.ReactNode[] = new Array(originChildCount + 2);

        if (originChildCount <= 1 || this.effect !== 'slide') {
            this.sliders = originChild;
            return;
        }

        Children.forEach(originChild, (child, index) => {
            if (index === 0) {
                arr[originChildCount + 1] = child;
            }

            if (index === originChildCount - 1) {
                arr[0] = child;
            }

            arr[index + 1] = child;
        });

        this.sliders = arr;
    }

    private stop(): void {
        this.clearTimer();
    }

    private restart(): void {
        this.startAutoplay();
    }

    private clearTimer(): void {
        if (this.timeId) {
            clearInterval(this.timeId);
            this.timeId = null;
        }
    }

    private getTranslateStyle(stopAnimate?: boolean): CSSProperties {
        const {currentIndex, carouselSize, delay} = this;
        const time = stopAnimate ? 0 : delay;
        const translateSize = (-1 - currentIndex) * carouselSize.width;
        return {
            transform: `translateX(${translateSize}px)`,
            transitionDuration: `${time}ms`
        };
    }

    private doSlideMode(stopAnimate?: boolean): void {
        this.emit('begin-translate', this.getTranslateStyle(stopAnimate));
        if (this.currentIndex > this.sliders.length - 3) {
            this.currentIndex = 0;
            setTimeout(() => {
                this.slideTo(0, true);
            }, this.delay);
            return;
        }

        if (this.currentIndex < 0) {
            this.currentIndex = this.sliders.length - 3;
            setTimeout(() => {
                this.slideTo(this.sliders.length - 3, true);
            }, this.delay);
            return;
        }
    }

    private doOtherMode(): void {
        if (this.currentIndex > this.sliders.length - 1) {
            this.currentIndex = 0;
        }
        if (this.currentIndex < 0) {
            this.currentIndex = this.sliders.length - 1;
        }

        this.emit('begin-translate', this.getTranslateStyle());
    }
}
