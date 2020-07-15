/**
 * @file usePrevProp 保存之前的属性
 */

import {ReactNode} from 'react';
import {IMenuOptions, ISubMenuOptions} from '@co-hooks/menu';

export interface IRcSubMenuExtra {
    children?: ReactNode;
    insId?: string;
}


export type IRcSubMenuProps = IRcSubMenuExtra & ISubMenuOptions;

export interface IRcMenuExtra {
    children?: ReactNode;
    onClick?: (id: string) => void;
    onOpenChange?: (openIds: string[]) => void;
}

export type IRcMenuProps<P> = IRcMenuExtra & IMenuOptions<P>;
