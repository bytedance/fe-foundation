/**
 * @file RcRegionProvider 二维区间处理(支持InputNumber、Slider、ColorPicker等)
 */

import React from 'react';
import {IRegion} from '@co-hooks/region';
import {RegionContext} from '../context/reigon';

export interface IRcRegionProviderProps {
    region: IRegion;
    children?: React.ReactNode;
}

export function RcRegionProvider(props: IRcRegionProviderProps): JSX.Element {

    const {children, region} = props;

    return (
        <RegionContext.Provider value={region}>
            {children}
        </RegionContext.Provider>
    );
}
