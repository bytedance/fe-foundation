/**
 * @file style
 */
import {StandardProperties} from 'csstype';

export type IStyleConfig =
    StandardProperties<string | number, string>
    & {retract?: {offset?: number; offsetWidth?: number}};
