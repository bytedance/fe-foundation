import {useEffect} from 'react';
import {useUpdate} from '@rc-hooks/use';
import {useUpload} from './useUpload';

export function useFileUpdate(id: string): void {
    const fileUpload = useUpload();
    const update = useUpdate();
    useEffect(() => {
        const fileChange = (changeId: string): void => {
            id === changeId && update();
        };
        const destroy = (): void => {
            fileUpload.removeListener('file-change', fileChange);
        };
        fileUpload.addListener('file-change', fileChange);
        return destroy;
    }, []);
}
