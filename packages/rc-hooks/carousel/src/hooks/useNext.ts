/**
 * @file useNext
 */

import {useCallback} from 'react';
import {useCarousel} from './useCarousel';

export function useNext(): () => void {
    const carousel = useCarousel();

    return useCallback(() => {
        carousel.slideTo(carousel.currentIndex + 1);
    }, []);
}
