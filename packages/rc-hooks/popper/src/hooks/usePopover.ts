/**
 * @file usePopover
 */

import {IElementPosition} from '@co-hooks/dom';
import {IElementPositionCaptureOptions, useElementPosition} from '@rc-hooks/dom';
import {useRefCallback, useSingleton, useUncontrolledShow, useUpdate} from '@rc-hooks/use';
import {CSSProperties, RefObject, useCallback, useEffect, useState} from 'react';
import {IArrowInfo, IPopoverOptions, ITouch, Popover, getDefaultTouch} from '@co-hooks/popper';
import {useGetPopper} from './useGetPopper';

export interface IUsePopoverOptions extends Partial<IPopoverOptions> {
    arrowRef: RefObject<HTMLElement>;
    defaultShow?: boolean;
    popoverId?: string;
    popoverRef: RefObject<HTMLElement>;
    singleGroupId?: string;
    onVisibleChange?: (show: boolean) => void;
    onShow?: () => void;
    onHide?: () => void;
    captureOptions?: IElementPositionCaptureOptions;
    onArrowInfoChange?: (arrowStyle: IArrowInfo) => void;
    onPopoverStyleChange?: (popperStyle: CSSProperties) => void;
}

export interface IUsePopoverResult<T> {
    popover: Popover<T>;
    touch: ITouch;
}

export function usePopover<T>(options: IUsePopoverOptions): IUsePopoverResult<T> {

    const {
        arrowRef,
        popoverId,
        popoverRef,
        singleGroupId,
        defaultShow,
        show,
        placement = 'bottom-start',
        onShow,
        onHide,
        captureOptions = {},
        onVisibleChange,
        onArrowInfoChange,
        onPopoverStyleChange,
        ...restOptions
    } = options;

    const update = useUpdate();
    const [touch, setTouch] = useState(getDefaultTouch());

    const onArrowInfoChangeCallback = useRefCallback(onArrowInfoChange);
    const onPopoverStyleChangeCallback = useRefCallback(onPopoverStyleChange);

    const [popperShow, onPopperShowChange] = useUncontrolledShow({
        show,
        onVisibleChange,
        onShow,
        onHide,
        defaultShow
    });

    const popper = useGetPopper<T>();
    const popover = useSingleton(() => new Popover<T>({
        popper,
        singleGroupId,
        id: popoverId,
        options: {
            show: popperShow,
            placement,
            ...restOptions
        }
    }));

    useElementPosition(
        popoverRef,
        () => popover.isShow(),
        (rect: IElementPosition) => {
            popover.updateRect(rect);
        },
        captureOptions
    );

    useEffect(() => {
        popover.updatePopover(popoverRef.current);
    });

    popover.updatePopoverOptions({
        show: popperShow,
        placement,
        ...restOptions
    });

    const handlePopperStyleChange = useCallback((popperStyle: CSSProperties) => {
        // if (popoverRef.current) {
        //     Object.assign(popoverRef.current.style, {
        //         ...popperStyle
        //     });
        // }
        onPopoverStyleChangeCallback(popperStyle);
    }, []);

    const handleArrowInfoChange = useCallback((arrowInfo: IArrowInfo) => {
        if (arrowRef.current) {
            Object.assign(arrowRef.current.style, arrowInfo.arrowStyle);
        }
        onArrowInfoChangeCallback(arrowInfo);
    }, []);

    useEffect(() => {
        popover.addListener('popover-style', handlePopperStyleChange);
        popover.addListener('touch-change', setTouch);
        popover.addListener('arrow-info-change', handleArrowInfoChange);
        popover.addListener('popover-show', onPopperShowChange);
        popover.addListener('last-trigger-update', update);

        return () => {
            popover.removeListener('popover-style', handlePopperStyleChange);
            popover.removeListener('touch-change', setTouch);
            popover.removeListener('arrow-info-change', handleArrowInfoChange);
            popover.removeListener('popover-show', onPopperShowChange);
            popover.removeListener('last-trigger-update', update);

            popover.dispose();
        };
    }, []);

    return {
        popover,
        touch
    };
}
