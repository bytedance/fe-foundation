/**
 * @file useOptionGroup
 */
import {useContext} from 'react';
import {OptionGroup} from '@co-hooks/select';
import {OptionGroupContext} from '../context/optionGroup';

export function useOptionGroup<T, P>(): OptionGroup<T, P> | null {
    const optionGroup = useContext(OptionGroupContext);

    return optionGroup;
}
