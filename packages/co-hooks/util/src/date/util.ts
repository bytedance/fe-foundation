/**
 * @file util 工具函数
 */

import {daysInMonth} from './tokens/month';

export function prevDate(date: Date, amount: number = 1): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - amount);
}

export function nextDate(date: Date, amount: number = 1): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function prevMonth(date: Date, amount: number = 1): Date {

    const dateOfMonth = date.getDate();
    const newDate = new Date(date);

    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() - amount);

    const maxDate = daysInMonth(newDate.getFullYear(), newDate.getMonth());

    newDate.setDate(Math.min(dateOfMonth, maxDate));

    return newDate;
}

export function nextMonth(date: Date, amount: number = 1): Date {
    return prevMonth(date, -amount);
}

export function prevYear(date: Date, amount: number = 1): Date {
    return prevMonth(date, amount * 12);
}

export function nextYear(date: Date, amount: number = 1): Date {
    return prevYear(date, -amount);
}

export function sortDate(dateList: Date[]): Date[] {
    return dateList.sort((a: Date, b: Date) => a.getTime() - b.getTime());
}
