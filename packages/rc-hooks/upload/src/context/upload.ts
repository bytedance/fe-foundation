import React from 'react';
import {FileUpload} from '..';

export const UploadContext = React.createContext<FileUpload<any> | null>(null);
