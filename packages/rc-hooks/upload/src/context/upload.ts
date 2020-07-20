import React from 'react';
import {FileUpload} from '../lib/fileUpload';

export const UploadContext = React.createContext<FileUpload<any> | null>(null);
