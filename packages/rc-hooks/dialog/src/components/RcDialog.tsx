/**
 * @file RcDialog 弹窗
 */

import {getZIndex} from '@co-hooks/dom';
import {UnionOmit} from '@co-hooks/util';
import {IUseCSSEnterLeaveOptions, useCSSEnterLeave} from '@rc-hooks/animation';
import {RcMask} from '@rc-hooks/mask';
import {RcPortal} from '@rc-hooks/portal';
import {useCombineRef} from '@rc-hooks/use';
import {Property} from 'csstype';
import React, {useCallback, useMemo, useRef, useState} from 'react';

export type PositionProperty = Property.Position;

export type IRcPositionHorizontal = 'left' | 'center' | 'right' | 'dock';

export type IRcPositionVertical = 'top' | 'center' | 'bottom' | 'dock';

export interface IRcHorizontal {
    horizontal: IRcPositionHorizontal;
    left?: number;
    right?: number;
}

export interface IRcVertical {
    vertical: IRcPositionVertical;
    top?: number;
    bottom?: number;
}

export interface IRcDialogExtraProps {
    show?: boolean;
    mask?: boolean;
    onMaskClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    maskStyle?: React.CSSProperties;
    maskClassName?: string;
    getContainer?: () => HTMLElement | null;
    forceFixed?: boolean;
    preventPointerEvent?: boolean;
    zIndex?: number;
    forceUpdateZIndex?: boolean;
    children?: React.ReactNode;
    wrapperClassName?: string;
    wrapperStyle?: React.CSSProperties;
    animation?: IUseCSSEnterLeaveOptions;
    wrapperRef?: React.Ref<HTMLDivElement>;
}

export type IRcPosition = IRcHorizontal & IRcVertical;

export type IRcDialogProps =
    UnionOmit<IRcDialogExtraProps & IRcPosition, React.HTMLAttributes<HTMLDivElement>>;

// 最外层容器的style
function getWrapperStyle(position: PositionProperty): React.CSSProperties {
    return {
        position,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        pointerEvents: 'none'
    };
}

// 计算弹层精确位置
function getPositionStyle(
    styleConf: IRcPosition,
    preventPointerEvent: boolean = false
): React.CSSProperties {
    const style: React.CSSProperties = {
        pointerEvents: preventPointerEvent ? 'none' : 'auto',
        position: 'absolute',
        zIndex: 2
    };

    switch (styleConf.horizontal) {
        case 'left':
            style.left = `${styleConf.left || 0}px`;
            break;
        case 'right':
            style.right = `${styleConf.right || 0}px`;
            break;
        case 'center':
            style.left = '50%';
            style.transform = 'translateX(-50%)';
            break;
        case 'dock':
            style.left = `${styleConf.left || 0}px`;
            style.right = `${styleConf.right || 0}px`;
            break;
    }

    switch (styleConf.vertical) {
        case 'top':
            style.top = `${styleConf.top || 0}px`;
            break;
        case 'bottom':
            style.bottom = `${styleConf.bottom || 0}px`;
            break;
        case 'center':
            style.top = '50%';
            style.transform = 'translateY(-50%)';
            break;
        case 'dock':
            style.top = `${styleConf.top || 0}px`;
            style.bottom = `${styleConf.bottom || 0}px`;
            break;
    }

    if (styleConf.horizontal === 'center' && styleConf.vertical === 'center') {
        style.transform = 'translate(-50%, -50%)';
    }

    return style;
}

const ACTIVE_POSTION: { [key: string]: boolean } = {
    fixed: true,
    absolute: true,
    relative: true
};

// 最外层容器的position
function getWrapperPosition(parent: HTMLElement): PositionProperty {
    const {position: parentPos} = getComputedStyle(parent);

    if (parent === document.body) {
        return 'fixed';
    }

    if (!ACTIVE_POSTION[parentPos || '']) {
        parent.style.position = 'relative';
    }

    return 'absolute';
}

function RcDialogFC(props: IRcDialogProps): JSX.Element {

    const {
        show = false,
        maskClassName,
        maskStyle = {},
        onMaskClick,
        children,
        getContainer,
        zIndex,
        forceUpdateZIndex,
        mask,
        preventPointerEvent = false,
        forceFixed = false,
        wrapperClassName,
        wrapperStyle,
        animation = {disabled: true},
        wrapperRef = null,
        style,
        horizontal,
        left,
        right,
        top,
        bottom,
        vertical,
        ...restProps
    } = props;

    const styleConf = {
        horizontal,
        left,
        right,
        top,
        bottom,
        vertical
    };

    const wrapperRefObject = useRef<HTMLDivElement>(null);
    const ref = useCombineRef(wrapperRef, wrapperRefObject);
    const [position, setPosition] = useState<PositionProperty>('absolute');

    const zIndexRandDep = useRef(0);
    zIndexRandDep.current = forceUpdateZIndex ? Math.random() : zIndexRandDep.current;
    const wrapperZIndex = useMemo(
        () => zIndex ?? getZIndex(),
        [zIndex, show, zIndexRandDep.current]
    );

    const handlePortalUpdated = useCallback(() => {
        const container = getContainer?.() ?? document.body;
        if (container) {
            setPosition(forceFixed ? 'fixed' : getWrapperPosition(container));
        }
    }, [getContainer]);

    useCSSEnterLeave(wrapperRefObject, animation);

    return (
        <RcPortal getContainer={getContainer} onUpdated={handlePortalUpdated}>
            {show && <div
                ref={ref}
                className={wrapperClassName}
                style={{zIndex: wrapperZIndex, ...getWrapperStyle(position), ...wrapperStyle}}
            >
                {mask && <RcMask
                    show
                    className={maskClassName}
                    style={{...maskStyle, zIndex: 1}}
                    onClick={onMaskClick}
                />}
                <div
                    {...restProps}
                    style={{...getPositionStyle(styleConf, preventPointerEvent), ...style}}
                >
                    {children}
                </div>
            </div>}
        </RcPortal>
    );
}

export const RcDialog = React.forwardRef<HTMLDivElement, Omit<IRcDialogProps, 'wrapperRef'>>(
    (props, ref) => <RcDialogFC {...props} wrapperRef={ref} />
);
