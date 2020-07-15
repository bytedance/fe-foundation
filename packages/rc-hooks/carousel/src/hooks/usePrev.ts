/**
 * @file usePrev
 */

import {useCallback} from 'react';
import {useCarousel} from './useCarousel';

export function usePrev(): () => void {
    const carousel = useCarousel();

    return useCallback(() => {
        carousel.slideTo(carousel.currentIndex - 1);
    }, []);
}
