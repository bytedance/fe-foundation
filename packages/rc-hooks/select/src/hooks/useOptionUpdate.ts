/**
 * @file useOptionUpdate
 */
import {useEffect} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {useSelect} from './useSelect';

export function useOptionUpdate(): void {
    const select = useSelect();
    const update = useUpdate();

    useEffect(() => {
        select.addListener('select-option-update', update);

        return () => {
            select.removeListener('select-option-update', update);
        };
    }, []);
}
