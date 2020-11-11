/**
 * @file useBrickInstance
 */
import {IRuntimeBrickProps, useRuntime} from '@chief-editor/runtime';
import {IBrick} from '@chief-editor/base';
import React, {CSSProperties, SyntheticEvent, useCallback} from 'react';
import {useSafeInit, useUpdate} from '@rc-hooks/use';
import {getBrickLayout} from '../util/layout';
import {RuntimeDispatcher} from '../components/RuntimeDispatcher';

export function useBrickInstance<V, DS, DP, CG, ST>(
    brick: IBrick<V, DS, DP, CG, ST>
): IRuntimeBrickProps<V, DS, DP, CG, ST> {

    const runtime = useRuntime();
    const update = useUpdate();

    useSafeInit(() => {
        brick.addListener('repaint', update);
        return () => brick.removeListener('repaint', update);
    });

    const dispatchEvent = useCallback((e: SyntheticEvent | string, value?: any) => {
        if (typeof e === 'string') {
            brick.dispatchEvent(e, value);
            return;
        }
        brick.dispatchEvent(e.type, e.nativeEvent);
    }, []);

    const setValue = useCallback((value: V) => {
        brick.setValue(value, true);
        brick.dispatchEvent('onChange', value);
    }, []);

    const renderPart = useCallback((name: string, style?: CSSProperties, className?: string) => {

        const part = brick.getPart(name);

        if (part == null) {
            return null;
        }

        return (
            <RuntimeDispatcher node={part} className={className} style={style} />
        );
    }, []);

    const getDatasource = useCallback((data: unknown) => brick.getDatasource(data), []);

    const getHook = useCallback((name: string) => brick.getHook(name), []);

    const setState = useCallback((state: Partial<Record<keyof ST, any>>) => brick.setState(state), []);

    const getByExpression = useCallback(
        (...args: Array<string | number>) => brick.getByExpression(...args),
        []
    );

    const {layout, styles = {}, env, ...extra} = brick.getInstance();
    const boardType = brick.getBoardType();
    const float = brick.isFloat();

    return {
        ...extra,
        layout: getBrickLayout(layout, boardType, float),
        env: runtime.env || env,
        styles,
        setValue,
        setState,
        dispatchEvent,
        renderPart,
        getDatasource,
        getHook,
        getByExpression
    };
}
