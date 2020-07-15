/**
 * @file useLockScreen
 */
import {getScrollbarWidth} from '@co-hooks/dom';
import {useCallback} from 'react';

export interface IUseLockScreenResult {
    lockScreen: () => void;
    unlockScreen: () => void;
}

let lockCount = 0;
let locked = false;
let documentBodyStyle: Partial<CSSStyleDeclaration> = {};

const scrollbarWidth = getScrollbarWidth();

export function useLockScreen(): IUseLockScreenResult {
    const handleLock = useCallback(() => {
        lockCount++;

        if (locked) {
            return;
        }

        locked = true;

        documentBodyStyle = {
            overflow: document.body.style.getPropertyValue('overflow'),
            position: document.body.style.getPropertyValue('position'),
            width: document.body.style.getPropertyValue('width')
        };

        const rewriteStyle: Partial<CSSStyleDeclaration> = {overflow: 'hidden'};

        if (scrollbarWidth) {
            if (['fixed', 'absolute'].indexOf(documentBodyStyle.position || '') >= 0) {
                rewriteStyle.position = documentBodyStyle.position;
            } else {
                rewriteStyle.position = 'relative';
            }

            const documentBodyWidth = documentBodyStyle.width
                ? getComputedStyle(document.body).getPropertyValue('width')
                : '100%';
            rewriteStyle.width = `calc(${documentBodyWidth} - ${scrollbarWidth}px)`;
        }

        Object.assign(document.body.style, rewriteStyle);
    }, []);

    const handleUnlock = useCallback(() => {
        locked && lockCount--;

        // lockCount = 0 时解锁
        if (lockCount || !locked) {
            return;
        }

        locked = false;

        Object.assign(document.body.style, documentBodyStyle);
    }, []);

    return {
        lockScreen: handleLock,
        unlockScreen: handleUnlock
    };
}
