/**
 * @file useEditorCls
 */
import {classnames} from '@co-hooks/util';

export function useEditorCls(
    prefix: string,
    suffixClass?: {[key: string]: string | boolean | undefined},
    ignoreRootCls?: boolean
): string {

    const mainClassName = 'fe-' + prefix;
    const suffixClassNames: string[] = [];

    if (suffixClass) {

        Object.keys(suffixClass).forEach(key => {

            const value = suffixClass[key];

            if (value === false || value == null || value === '') {
                return;
            }

            const suffix = typeof value === 'string' ? '-' + value : '';

            suffixClassNames.push(mainClassName + '-' + key + suffix);
        });
    }

    return classnames(ignoreRootCls ? undefined : mainClassName, suffixClassNames);
}
