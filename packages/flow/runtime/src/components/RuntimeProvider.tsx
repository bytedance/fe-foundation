/**
 * @file RuntimeProvider 运行时信息提供
 */
import React, {PropsWithChildren, useMemo} from 'react';
import {RuntimeContext} from '../context/runtime';
import {IRuntimeContext} from '../types';

export function RuntimeProvider(props: PropsWithChildren<IRuntimeContext>): JSX.Element {

    const {BrickContainers, Bricks, BrickRender, BrickContainerRender, BoardRender, env, children} = props;

    const value = useMemo<IRuntimeContext>(() => ({
        Bricks,
        BoardRender,
        BrickRender,
        BrickContainerRender,
        BrickContainers,
        env
    }), [Bricks, BoardRender, BrickRender, BrickContainers, BrickContainerRender, env]);

    return (
        <RuntimeContext.Provider value={value}>
            {children}
        </RuntimeContext.Provider>
    );
}
