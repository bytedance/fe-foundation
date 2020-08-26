/**
 * @file UniqueIdTransformer 唯一ID
*/

import {ITransformPlugin, transform} from '../Transformer';
import {IReplaceIdTransformerOptions, ISvgInfo} from '../types';
import {guid} from '../util';
import {GetIdTransformer} from './GetIdTransformer';
import {RemoveIdTransformer} from './RemoveIdTransformer';
import {ReplaceIdTransformer} from './ReplaceIdTransformer';

export interface IUniqueIdTransformerOptions {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;

    idName?: string;

    removeUnusedIds?: boolean;
}

export function UniqueIdTransformer(options: IUniqueIdTransformerOptions): ITransformPlugin {

    const {
        prefix = false,
        propName = 'props',
        idName = 'id',
        removeUnusedIds = false
    } = options;

    return {
        // 进入时记录所有的ID
        enter(info: ISvgInfo): ISvgInfo {

            // 清空映射表
            const map: IReplaceIdTransformerOptions = {};

            const IdMap: {[key: string]: boolean} = {};

            // 获取所有的Id
            info = transform(info, [GetIdTransformer(IdMap)]);

            // 生成Id映射（8位就够了，不用那么多）
            Object.keys(IdMap).forEach(key => map[key] = {
                newId: guid().slice(0, 8),
                propName: (prefix ? propName + '.' : '') + idName,
                used: false
            });

            // 替换Id
            info = transform(info, [ReplaceIdTransformer(map)]);

            const needRemoveIds = Object
                .keys(map)
                .filter(item => !map[item].used)
                .map(item => map[item].newId);

            // 把没用的Id去掉
            if (removeUnusedIds && needRemoveIds && needRemoveIds.length) {
                info = transform(info, [RemoveIdTransformer({
                    propName: (prefix ? propName + '.' : '') + idName,
                    ids: needRemoveIds
                })]);
            }

            return info;
        }
    };
}
