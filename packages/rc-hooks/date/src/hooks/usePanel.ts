/**
 * @file usePanel 获取面板信息
 */
import {BasePanel} from '@co-hooks/date';
import {useDate} from './useDate';

export function usePanel(part: string): BasePanel {
    const date = useDate();
    return date.getPanel(part);
}
