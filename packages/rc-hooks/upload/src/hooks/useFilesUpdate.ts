import {useEffect} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {useUpload} from './useUpload';

export function useFilesUpdate(): void {
    const fileUpload = useUpload();
    const update = useUpdate();
    useEffect(() => {
        const destroy = (): void => {
            fileUpload.removeListener('files-change', update);
        };
        fileUpload.addListener('files-change', update);
        return destroy;
    }, []);
}
