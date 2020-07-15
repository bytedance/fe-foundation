import React, {useContext} from 'react';
import {FileUpload, UploadContext} from '..';

export function useUpload<U>(): FileUpload<U> {
    const fileUpload =  useContext(UploadContext);
    if (fileUpload === null) {
        throw new Error('useUpload must under RcUpload');
    }
    return fileUpload;
}
