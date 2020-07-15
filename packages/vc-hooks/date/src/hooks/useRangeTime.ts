/**
 * @file useRangTime
 */

import {RangeTime, Time} from '@co-hooks/date';
import {useSimpleTime} from './useSimpleTime';

export interface IUseRangeTimeResult {
    root: RangeTime;
    leftPanel: Time;
    rightPanel: Time;
}

export interface ITimeRangDisabled {
    disabledHours?: (v: number) => boolean;
    disabledMinutes?: (v: number) => boolean;
    disabledSeconds?: (v: number) => boolean;
}

export interface IRangTimeOptions {
    handleLeftChange: (value: Date) => void;
    handleRightChange: (value: Date) => void;
}

export function useRangeTime(options: IRangTimeOptions): IUseRangeTimeResult {
    const {handleLeftChange, handleRightChange} = options;

    const leftPanel = useSimpleTime({
        part: 'left',
        onChange: handleLeftChange
    });
    const rightPanel = useSimpleTime({
        part: 'right',
        onChange: handleRightChange
    });
    const root = new RangeTime({left: leftPanel, right: rightPanel});

    return {
        root,
        leftPanel,
        rightPanel
    };
}
