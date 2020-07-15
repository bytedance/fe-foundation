import {useEffect, useState} from 'react';
import {useUpload} from './useUpload';

export function useDisabled(disabled: boolean): boolean {
    const [_disabled, setDisabled] = useState(disabled);
    const fileUpload = useUpload();
    console.log('disable:', disabled, '_disable:', _disabled);
    useEffect(() => {
        const destroy = (): void => {
            fileUpload.removeListener('disabled-change', setDisabled);
        };
        setDisabled(disabled);
        fileUpload.addListener('disabled-change', setDisabled);
        return destroy;
    }, [disabled]);
    return _disabled;
}
