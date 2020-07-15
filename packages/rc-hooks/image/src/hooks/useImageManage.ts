/**
 * @file useImage
 */
import {useEffect} from 'react';
import {IImageManageOptions, ImageManage} from '@co-hooks/image';
import {useSingleton} from '@rc-hooks/use';

export interface IImageManage extends IImageManageOptions {
    imageType?: string;
}

export function useImageManage<T extends Blob>(
    file: T | string,
    options: IImageManage
): ImageManage {
    const {imageType = 'image/jpeg', ...extra} = options;
    const imageManage = useSingleton(() => new ImageManage());

    imageManage.updateImageOptions(extra);

    useEffect(() => {
        if (file == null) {
            return;
        }

        if (typeof file === 'string') {
            imageManage.initImage(file, imageType);
        } else {
            imageManage.initImage(file);
        }

        return () => {
            imageManage.dispose();
        };
    }, [file]);

    return imageManage;
}
