/**
 * @file SchedulePanel
 */
import {padding} from '@co-hooks/util';
import {Schedule} from './Schedule';

export enum ScheduleSelectType {
    NONE = 'none',
    SELECTED = 'selected'
}

export interface IScheduleItem {
    label: string;
    value: number;
    formatValue: string;
    selectType: ScheduleSelectType;
    // tryingSelectType: ScheduleSelectType;
    disabled: boolean;
}

export interface IScheduleList {
    label: string;
    items: IScheduleItem[];
}

export class SchedulePanel {
    private readonly root: Schedule;

    constructor(root: Schedule) {
        this.root = root;
    }

    public getScheduleList(): IScheduleList[] {
        const scheduleList: IScheduleList[] = [];
        const datasource = this.root.getDatasource();
        const divider = this.root.getDivider();

        datasource.forEach(label => {
            const item: IScheduleList = {
                label,
                items: []
            };

            const len = divider * 24;

            for (let i = 0; i < len; i++) {
                const col: IScheduleItem = {
                    label,
                    value: i,
                    selectType: this.root.getItemSelectType(label, i),
                    // tryingSelectType: this.root.getItemSelectType(label, i, true),
                    formatValue: this.getFormatValue(i),
                    disabled: this.root.isTimeDisabled(label, i)
                };

                item.items.push(col);
            }

            scheduleList.push(item);
        });

        return scheduleList;
    }

    private getFormatValue(index: number): string {
        const divider = this.root.getDivider();
        const colTime = 60 / divider;

        const st = colTime * index;
        const et = colTime * (index + 1);

        return `${formatTime(st)}-${formatTime(et)}`;
    }
}

export function formatTime(time: number): string {
    return `${padding(String(time / 60 | 0), 2)}:${padding(String(time % 60), 2)}`;
}
