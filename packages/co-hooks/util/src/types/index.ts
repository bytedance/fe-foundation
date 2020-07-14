/**
 * @file types 常用类型工具
 */

// 提取所有没在定义中的T属性，并追加到T里面
export type UnionOmit<T, K> = T & Omit<K, keyof T>;

// 一个可以用来当任何函数的类型
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FunctionAny = (...args: any[]) => any;

// 补齐TypeScript的类型定义
export type FunctionParams<T extends FunctionAny> = T extends (...args: infer R) => unknown
    ? R
    : never;

// 用于比较两个对象是否相同的函数类型
export type EqualFunction<T> = (val1: T, val2: T) => boolean;

// 用于比较大小的函数类型，小于0表示val1 < val2，大于0表示val1 > val2，为0表示相同
export type ComparatorFunction<T> = (val1: T, val2: T) => number;

export type RequiredKeys<T> = {
    [K in keyof T]-?: T extends Record<K, T[K]> ? K : never
}[keyof T];

export interface IDateLocale {
    defaultFormat: {
        week: string;
        date: string;
        month: string;
        year: string;
        time: string;
        dateTime: string;
    };
    startDay: number;
    monthList: string[];
    shortMonthList: string[];
    dayList: string[];
    shortDayList: string[];
    shortestDayList: string[];
}
