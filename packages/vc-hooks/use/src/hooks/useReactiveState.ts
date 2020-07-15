/**
 * @file useReactiveState 用于简化useShallowState的语法
 */
import {toReactive} from './toReactive';

export function useReactiveState<T>(getter: () => Required<T>): [Required<T>, VoidFunction] {

    const state = toReactive(getter());

    const update = (): void => {
        Object.assign(state, getter());
    };

    return [state, update];
}
