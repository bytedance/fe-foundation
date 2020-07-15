/**
 * @file CompareRangeDate
 */
import {Emitter} from '@co-hooks/emitter';
import {DATE_MILLISECONDS, sortDate, weekOfYear} from '@co-hooks/util';
import {IBaseDateOptions, ISetPanelDateEventParams} from './BaseDate';
import {PanelType} from './BasePanel';
import {RangeDate, RangePanelUpdater, SetPanelDate} from './RangeDate';

export interface ICompareRangeDateInnerValue {
    source: Date[];
    isCompare: boolean;
    target: Date[];
}

export interface ICompareRangeDateEvent {
    'offset-update': [number | null];
    'value-change': [ICompareRangeDateInnerValue];
}

interface ICompareRangeDateOptions extends IBaseDateOptions {
    sourceOffset?: number;
    targetOffset?: number;
}

export class CompareRangeDate extends Emitter<ICompareRangeDateEvent> {

    public readonly sourceRangeDate: RangeDate;

    public readonly targetRangeDate: RangeDate;

    private readonly panelType: PanelType;

    private startDay: number = 0;

    private targetOffset?: number;

    private offsetDate: number | null = null;

    private isCompare: boolean = false;

    private onSetPanelDate?: SetPanelDate;

    private onRangePanelUpdate?: RangePanelUpdater;

    constructor(panelType: PanelType, rangeDateParts: string[]) {
        super();

        this.sourceRangeDate = new RangeDate(panelType);
        this.targetRangeDate = new RangeDate(panelType);
        this.panelType = panelType;

        rangeDateParts.forEach((part: string) => {
            this.sourceRangeDate.createPanel(panelType, part);
            this.targetRangeDate.createPanel(panelType, part);
        });

        this.init();
    }

    public updateValue(value: ICompareRangeDateInnerValue): void {
        const {source, isCompare, target} = value;

        this.isCompare = isCompare;
        this.sourceRangeDate.updateValue(source);
        this.targetRangeDate.updateValue(target);
    }

    public updateOptions(options: ICompareRangeDateOptions): void {
        const {
            sourceOffset,
            targetOffset,
            startDay,
            ...extra
        } = options;

        this.startDay = startDay || 0;
        this.targetOffset = targetOffset;
        this.sourceRangeDate.updateOptions({...extra, startDay, offset: sourceOffset});
        this.targetRangeDate.updateOptions({...extra, startDay, offset: targetOffset});
    }

    public setSetPanelDate(updater?: SetPanelDate): void {
        this.onSetPanelDate = updater;
    }

    public setRangePanelUpdate(updater: RangePanelUpdater): void {
        this.onRangePanelUpdate = updater;
    }

    public getOffset(): number | null {
        return this.offsetDate;
    }

    public getIsCompare(): boolean {
        return this.isCompare;
    }

    public dispose(): void {
        this.sourceRangeDate.removeListener('value-change', this.sourceValueUpdate);
        this.targetRangeDate.removeListener('value-change', this.targetValueUpdate);
        this.sourceRangeDate.removeListener('set-panel-date', this.sourceSetPanelDate);
        this.targetRangeDate.removeListener('set-panel-date', this.targetSetPanelDate);
    }

    private init(): void {
        this.sourceRangeDate.setRangePanelUpdate(this.calculateOffsetDate);
        this.targetRangeDate.setRangePanelUpdate(this.targetRangePanelUpdate);
        this.sourceRangeDate.addListener('value-change', this.sourceValueUpdate);
        this.targetRangeDate.addListener('value-change', this.targetValueUpdate);
        this.sourceRangeDate.addListener('set-panel-date', this.sourceSetPanelDate);
        this.targetRangeDate.addListener('set-panel-date', this.targetSetPanelDate);
    }

    private calculateOffsetDate = (_: RangeDate, source: Date[]): void => {

        const [start, end] = sortDate(source);
        this.offsetDate = this.getOffsetDate(start, end);
        const targetOffset = this.targetOffset ?? (source.length && this.offsetDate);

        this.targetRangeDate.updateOptions({offset: targetOffset, startDay: this.startDay});
        this.onRangePanelUpdate && this.onRangePanelUpdate(this.sourceRangeDate, source);
        this.emit('offset-update', this.offsetDate);
    };

    private sourceValueUpdate = (value: Date[]): void => {
        this.emit('value-change', {
            source: value,
            isCompare: this.isCompare,
            target: []
        });
    };

    private sourceSetPanelDate = (params: ISetPanelDateEventParams): void => {
        this.onSetPanelDate && this.onSetPanelDate(this.sourceRangeDate, params);
    };

    private targetValueUpdate = (value: Date[]): void => {
        if (!this.isCompare) {
            throw new Error(`Cant change target value when isCompare is ${this.isCompare}`);
        }

        this.emit('value-change', {
            source: this.sourceRangeDate.getValue(),
            isCompare: this.isCompare,
            target: value
        });
    };

    private targetRangePanelUpdate = (_: RangeDate, value: Date[]): void => {
        this.onRangePanelUpdate && this.onRangePanelUpdate(this.targetRangeDate, value);
    };

    private targetSetPanelDate = (params: ISetPanelDateEventParams): void => {
        this.onSetPanelDate && this.onSetPanelDate(this.targetRangeDate, params);
    };

    private getOffsetDate(start: Date, end: Date): number {

        if (this.panelType === PanelType.YEAR) {
            return end.getFullYear() - start.getFullYear() + 1;
        }

        if (this.panelType === PanelType.MONTH) {
            return end.getFullYear() * 12 + end.getMonth() - start.getFullYear() * 12 - start.getMonth() + 1;
        }

        if (this.panelType === PanelType.WEEK) {
            return weekOfYear(end, this.startDay, 1970) - weekOfYear(start, this.startDay, 1970) + 1;
        }

        return ((end.getTime() - start.getTime()) / DATE_MILLISECONDS | 0) + 1;
    }
}
