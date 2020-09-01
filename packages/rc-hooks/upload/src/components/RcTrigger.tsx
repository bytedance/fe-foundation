import React, {ChangeEvent, useCallback, useEffect, useRef, useState, Fragment} from 'react';
import {guid} from '@co-hooks/util';
import {useUpload} from '../hooks/useUpload';
import {IRcTriggerProps} from '../types/interface';

export function RcTrigger(props: IRcTriggerProps): JSX.Element | null {
    const {
        children,
        disabled = false,
        multiple = false,
        accept = '*/*'
    } = props;
    const [key, setKey] = useState(guid);
    const fileUpload = useUpload();
    const inputRef = useRef<HTMLInputElement>(null);
    const onClick = useCallback(() => {
        if (!disabled) {
            fileUpload.clickInput();
        }
    }, [disabled]);
    const onFileChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
        if (ev?.target.files) {
            fileUpload.addFiles(ev.target.files);
            setKey(guid());
        }
    }, []);

    useEffect(() => {
        fileUpload.init(inputRef);
    }, []);
    const _children = typeof children === 'function' ? children({disabled}) : children;
    return (
        <Fragment>
            <label onClick={onClick}>{_children}</label>
            <input
                type="file"
                key={key}
                ref={inputRef}
                style={{display: 'none'}}
                onChange={onFileChange}
                multiple={multiple}
                accept={accept}
            />
        </Fragment>
    );
}
