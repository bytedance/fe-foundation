/**
 * @file useBrickActiveUpdate
 */
import {EditorBrickGlobal} from '@chief-editor/core';
import {useRefGetter, useUpdate} from '@rc-hooks/use';
import {useEffect} from 'react';

export function useBrickActiveChangeUpdate(brick: EditorBrickGlobal): void {
    const activeGetter = useRefGetter((brick.isActiveBrick()));
    const update = useUpdate();

    useEffect(() => {
        function updateBrick(active: boolean): void {
            if (activeGetter() === active) {
                return;
            }

            update();
        }

        brick.addListener('active-change', updateBrick);

        return () => {
            brick.removeListener('active-change', updateBrick);
        };
    }, []);
}
