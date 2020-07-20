/**
 * @file upload
 */

import React from 'react';
import {UploadContext} from '../context/upload';
import {FileUpload} from '../lib/fileUpload';

export interface IRcUploadProviderProps<U> {
    children?: React.ReactNode;
    upload: FileUpload<U>;
}

export function RcUploadProvider<U>(props: IRcUploadProviderProps<U>): JSX.Element {

    const {children, upload} = props;

    return (
        <UploadContext.Provider value={upload}>
            {children}
        </UploadContext.Provider>
    );
}
