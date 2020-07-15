/**
 * @file useReactiveState 内置响应式数据模型
 */
import {useRefGetter, useShallowState, useSingleton} from '@rc-hooks/use';
import {useEffect} from 'react';

export interface IRepaintedClass<O> {

    updateOptions(options: O): void;

    addListener(type: 'repaint', callback: VoidFunction): void;

    removeListener(type: 'repaint', callback: VoidFunction): void;

    dispose(): void;
}

export function useReactiveState<T extends IRepaintedClass<O>, O, S>(
    creator: () => T,
    options: O,
    updater: (ins: T) => S
): [T, S] {

    const ins = useSingleton(creator);
    const [state, setState] = useShallowState(() => updater(ins));
    const getter = useRefGetter(updater);

    ins.updateOptions(options);

    useEffect(() => {

        const callback = (): void => {
            setState(getter()(ins));
        };

        ins.addListener('repaint', callback);

        return () => {
            ins.removeListener('repaint', callback);
            ins.dispose();
        };
    }, []);

    return [ins, state];
}
