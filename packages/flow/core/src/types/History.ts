/**
 * @file history
 */

export interface IHistoryExecute<T, D> {
    context?: T;
    execute: (data: D, context: T) => [boolean, D];
    reset: (data: D, context: T) => boolean;
}
