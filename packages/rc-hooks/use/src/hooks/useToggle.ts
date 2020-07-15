/**
 * @file useToggle
 */
import {useCallback, useState} from 'react';

export function useToggle(initial: boolean): [boolean, () => void, () => void] {
    const [toggle, setToggle] = useState(initial);

    const setTrue = useCallback(() => {
        setToggle(true);
    }, []);

    const setFalse = useCallback(() => {
        setToggle(false);
    }, []);

    return [toggle, setTrue, setFalse];
}
