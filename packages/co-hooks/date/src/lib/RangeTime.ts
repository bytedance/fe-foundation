/**
 * @file RangeTime
 */

import {Time, TimeType} from './Time';

export interface IRangeTime {
    left: Time;
    right: Time;
}

export class RangeTime {
    private readonly left: Time;
    private readonly right: Time;

    constructor(options: IRangeTime) {
        this.left = options.left;
        this.right = options.right;
    }

    public repaint(): void {
        this.left.repaintTime();
        this.right.repaintTime();
    }

    public compare(v: number, type: TimeType, part: string): boolean {
        const isLeft = part === this.left.part;
        const leftPanel = this.left;
        const rightPanel = this.right;

        switch (type) {
            case TimeType.HOUR:
                return this.hourDisabled(v, leftPanel, rightPanel, isLeft);
            case TimeType.MINUTE:
                return this.minuteDisabled(v, leftPanel, rightPanel, isLeft);
            case TimeType.SECOND:
                return this.secondDisabled(v, leftPanel, rightPanel, isLeft);
        }
    }

    private hourDisabled(v: number, l: Time, r: Time, isLeft: boolean): boolean {
        const {showMinute, showSecond} = l;
        if (l.hour === null || r.hour === null) {
            return false;
        }

        if (isLeft) {
            if (
                (showMinute && l.minute && r.minute && l.minute > r.minute)
                || (showMinute
                    && l.minute === r.minute
                    && showSecond
                    && l.second
                    && r.second
                    && l.second > r.second)
                || (!showMinute && showSecond && l.second && r.second && l.second > r.second)
            ) {
                return v >= r.hour;
            }

            return v > r.hour;
        }

        if (
            (showMinute && l.minute && r.minute && l.minute > r.minute)
            || (showMinute
                && l.minute === r.minute
                && showSecond
                && l.second
                && r.second
                && l.second > r.second)
            || (!showMinute && showSecond && l.second && r.second && l.second > r.second)
        ) {
            return v <= l.hour;
        }

        return v < l.hour;
    }

    private minuteDisabled(v: number, l: Time, r: Time, isLeft: boolean): boolean {
        const {showHour, showSecond} = l;
        if ((showHour && l.hour !== r.hour) || r.minute === null || l.minute === null) {
            return false;
        }

        if (isLeft) {
            if (showSecond && l.second && r.second && l.second > r.second) {
                return v >= r.minute;
            }

            return v > r.minute;
        }

        if (showSecond && l.second && r.second && l.second > r.second) {
            return v <= l.minute;
        }

        return v < l.minute;
    }

    private secondDisabled(v: number, l: Time, r: Time, isLeft: boolean): boolean {
        const {showHour, showMinute} = l;
        if (
            r.second === null
            || l.second === null
            || (showHour && l.hour !== r.hour)
            || (showMinute && l.minute !== r.minute)
        ) {
            return false;
        }

        if (isLeft) {
            return v > r.second;
        }

        return v < l.second;
    }
}
