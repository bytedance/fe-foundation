import React, {useContext} from 'react';
import {FileUpload} from '../lib/fileUpload';
import {UploadContext} from '../context/upload';

export function useUpload<U>(): FileUpload<U> {
    const fileUpload = useContext(UploadContext);
    if (fileUpload === null) {
        throw new Error('useUpload must under RcUpload');
    }
    return fileUpload;
}
