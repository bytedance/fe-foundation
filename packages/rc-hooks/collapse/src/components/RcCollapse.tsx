/**
 * @file RcCollapse 级联类组件
 */

import React, {useEffect} from 'react';
import {Collapse, IRcCollapseOptions} from '@co-hooks/collapse';
import {useRefCallback, useSingleton} from '@rc-hooks/use';
import {CollapseContext} from '../context/collapse';

export type IRcCollapseProps = IRcCollapseOptions & {
    onOpenIdsChange?: (ids: string[]) => void;
    children?: React.ReactNode;
};

export function RcCollapse(props: IRcCollapseProps): JSX.Element {

    const {children, onOpenIdsChange, ...rest} = props;
    const collapse = useSingleton(() => new Collapse());

    collapse.updateCollapse(rest);

    const onOpenIdsChangeCallback = useRefCallback(onOpenIdsChange);

    useEffect(() => {

        collapse.addListener('open-ids-change', onOpenIdsChangeCallback);

        return () => {
            collapse.removeListener('open-ids-change', onOpenIdsChangeCallback);
            collapse.dispose();
        };
    }, []);

    return (
        <CollapseContext.Provider value={collapse}>
            {children}
        </CollapseContext.Provider>
    );
}
