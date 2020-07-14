/**
 * @file minute 分钟获取
 */
import {createNumberConverter} from '../convert';


createNumberConverter({
    format: 'H',
    paddingFormat: 'HH',
    maxLength: 2,
    getter: date => date.getHours(),
    field: 'hour'
});

createNumberConverter({
    format: 'h',
    paddingFormat: 'hh',
    maxLength: 2,
    getter: date => date.getHours(),
    field: 'hour'
});

createNumberConverter({
    format: 'm',
    paddingFormat: 'mm',
    maxLength: 2,
    getter: date => date.getMinutes(),
    field: 'minute'
});

createNumberConverter({
    format: 's',
    paddingFormat: 'ss',
    maxLength: 2,
    getter: date => date.getSeconds(),
    field: 'second'
});
