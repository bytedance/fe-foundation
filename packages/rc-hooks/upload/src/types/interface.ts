import React from 'react';
import {FileClass} from '../lib/file';
import {EventType} from './type';
import {FileStatus, FileType} from './enum';

interface IObject {
    [key: string]: string;
}

export interface IRequest {
    abort(): void;
}

export interface ISize {
    width: number | string;
    height: number | string;
}

export interface IBaseResType {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}


export interface IFileUploadErrorMessage {
    overflowCount: string;
}

export interface IErrorEvent {
    type: string;
    message: string;
}

export interface IBaseFile {
    readonly id: string;
    readonly file?: File;
    name?: string;
    url: string;
    fileType?: FileType;
    fileStatus?: FileStatus;
    errmsg?: string;
    data?: unknown;
}

export interface IFileUploadChangeEvent<U = IBaseResType> {
    type: EventType;
    file: IBaseFile;
    index?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response?: U;
}

export interface IFile extends IBaseFile {
    previewUrl: string;
    // extname?: string;
    // status: FileStatus;
    request?: IRequest;
}

export interface IRcTriggerProps {
    children?: React.ReactNode;
    disabled?: boolean;
    accept?: string;
    multiple?: boolean;
    className?: string;
}

export interface IUploadEvent<T, U> {
    onChange?: (event: IFileUploadChangeEvent<U>) => void;
    onValueChange?: (files: T) => void;
    onDisabledChange?: (disabled: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUploaded?: (response: U, file: IBaseFile) => void;
    onError?: (error: IErrorEvent) => void;
}

export interface IFileUploadEvent<U> {
    'disabled-change': [boolean];
    'file-change': [string];
    'files-change': [FileClass[]];
    'error': [IErrorEvent];
    'change': [IFileUploadChangeEvent<U>];
    'value-change': [IBaseFile[]];
    'uploaded': [unknown, IBaseFile];
}

export interface IFileUploadOptions<U> {
    errors?: IFileUploadErrorMessage;
    accept?: string;
    multiple?: boolean;
    maxLength?: number;
    autoUpload?: boolean;
    uploadUrl?: string;
    name?: string;
    value: IBaseFile[];
    headers?: {[key: string]: string};
    data?: ((file: File) => IObject) | IObject;
    withCredentials?: boolean;
    customRequest?: (
        file: File,
        uploaded: (response: U) => void,
        progress: (a: number, b: number) => void
    ) => void;
}

export interface IBaseUpload<T, U> extends IFileUploadOptions<U>, IUploadEvent<T, U>, IRcTriggerProps {
    className?: string;
}
