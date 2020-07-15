/**
 * @file useUncontrolledShow
 */
import {useUncontrolled} from './useUncontrolled';

export interface UncontrolledShowInfo {
    show?: boolean;
    defaultShow?: boolean;
    onShow?: () => void;
    onHide?: () => void;
    onVisibleChange?: (visible: boolean) => void;
}

export function useUncontrolledShow(options: UncontrolledShowInfo): [boolean, (value: boolean) => void] {

    const {show, defaultShow, onHide, onShow, onVisibleChange} = options;

    return useUncontrolled(
        typeof show === 'boolean',
        false,
        show,
        defaultShow,
        (nv: boolean) => {

            if (nv) {
                onShow && onShow();
            } else {
                onHide && onHide();
            }

            onVisibleChange && onVisibleChange(nv);
        },
        'show'
    );
}
