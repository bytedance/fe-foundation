/**
 * @file group
 */
import {IBrickDataGlobal, ILayoutConfig} from '@chief-editor/base';

export function getDefaultGroupData(layout: ILayoutConfig): IBrickDataGlobal {
    return {
        'info': {
            'id': '',
            'field': '',
            'label': '组',
            'expandProps': {
                'props': {},
                'styles': {}
            },
            lock: false
        },
        'config': {
            'props': {
                'className': '',
                'showBrick': true
            }
        },
        layout,
        parts: {
            content: {
                bricks: []
            }
        },
        'type': 'Group'
    };
}
