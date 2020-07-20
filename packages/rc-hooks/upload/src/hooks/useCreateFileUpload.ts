/**
 * @file useCreateFileUpload
 */

import {useSingleton} from '@rc-hooks/use';
import {FileUpload} from '../lib/fileUpload';

export function useCreateFileUpload<U>(): FileUpload<U> {
    return useSingleton(() => new FileUpload<U>());
}
