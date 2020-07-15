/**
 * @file RcCarousel
 */

import {useSingleton} from '@rc-hooks/use';
import React from 'react';
import {Carousel, ICarouselOptions} from '../lib/Carousel';
import {CarouselContext} from '../context/carousel';

export type IRcCarouselProps = ICarouselOptions & {
    children?: React.ReactNode;
};

export function RcCarousel(props: IRcCarouselProps): JSX.Element {
    const {children, ...options} = props;
    const carousel = useSingleton(() => new Carousel(options));
    carousel.updateCarouselOptions(options);

    return (
        <CarouselContext.Provider value={carousel}>
            {children}
        </CarouselContext.Provider>
    );
}
