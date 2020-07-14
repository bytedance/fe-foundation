/**
 * @file setup
 */

import React, {FunctionComponent} from 'react';
import {act, create} from 'react-test-renderer';

export type IHookLikeFunc = (...args: any) => any;

export type FunctionParams<T extends IHookLikeFunc> = T extends (...args: infer R) => any
    ? R
    : never;

export interface IRenderHookResult<T extends IHookLikeFunc> {
    readonly getResult: () => ReturnType<T>;
    readonly waitForNextUpdate: () => Promise<void>;
    readonly unmount: () => void;
    readonly execute: (fn: () => void) => void;
    readonly rerender: (newProps?: FunctionParams<T>) => void;
}

export interface IWrapperComponentProps<T extends IHookLikeFunc> {
    hook: T;
    params: FunctionParams<T>;
    callback: (value: ReturnType<T>) => void;
    errorCallback: (error: Error) => void;
}

function WrapperComponent<T extends IHookLikeFunc>(props: IWrapperComponentProps<T>): null {

    const {hook, callback, errorCallback, params} = props;

    try {
        callback(hook(...params));
    } catch (err) {
        errorCallback(err);
    }

    return null;
}

export function renderWrapperHook<T extends IHookLikeFunc>(
    fn: T,
    wrapper: React.ComponentType,
    ...initialProps: FunctionParams<T>
): IRenderHookResult<T> {

    let value: ReturnType<T> | null = null;
    let error: Error | null = null;
    const resolvers: Array<() => void> = [];

    const callback = (v: ReturnType<T>): void => {
        value = v;
        resolvers.splice(0, resolvers.length).forEach(resolve => resolve());
    };

    const errorCallback = (e: Error): void => {
        error = e;
        resolvers.splice(0, resolvers.length).forEach(resolve => resolve());
    };

    const hookProps = {current: initialProps};

    const wrapped = (innerElement: React.ReactElement): React.ReactElement => {
        return React.createElement(wrapper, null, innerElement);
    };

    let testRenderer: any = {};

    act(() => {
        testRenderer = create(wrapped(
            <WrapperComponent
                hook={fn}
                params={hookProps.current}
                callback={callback}
                errorCallback={errorCallback}
            />
        ));
    });

    const {unmount, update} = testRenderer;

    return {
        getResult() {

            if (error) {
                throw error;
            }

            return value as ReturnType<T>;
        },
        waitForNextUpdate: () => new Promise(resolve => {
            resolvers.push(resolve);
        }),
        rerender: (newProps = hookProps.current) => {

            hookProps.current = newProps;

            act(() => {
                update(wrapped(
                    <WrapperComponent
                        hook={fn}
                        params={hookProps.current}
                        callback={callback}
                        errorCallback={errorCallback}
                    />
                ));
            });
        },
        execute: fn => {
            act(() => {
                fn();
            });
        },
        unmount: () => {
            act(() => {
                unmount();
            });
        }
    };
}

const EmptyWrapper: FunctionComponent<{}> = ({children}) => (<div>{children}</div>);

export function renderHook<T extends IHookLikeFunc>(
    fn: T,
    ...initialProps: FunctionParams<T>
): IRenderHookResult<T> {
    return renderWrapperHook(fn, EmptyWrapper, ...initialProps);
}

declare global {

    function renderWrapperHook<T extends IHookLikeFunc>(
        fn: T,
        wrapper: React.ComponentType,
        ...initialProps: FunctionParams<T>
    ): IRenderHookResult<T>;

    function renderHook<T extends IHookLikeFunc>(
        fn: T,
        ...initialProps: FunctionParams<T>
    ): IRenderHookResult<T>;
}

Object.assign(global, {
    renderWrapperHook,
    renderHook
});
