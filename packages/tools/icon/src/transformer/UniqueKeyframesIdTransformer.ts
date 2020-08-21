/**
 * @file UniqueKeyframesIdTransformer 唯一ID
*/

import {ITransformPlugin, transform} from '../Transformer';
import {IReplaceIdTransformerOptions, ISvgInfo} from '../types';
import {guid} from '../util';
import {GetKeyframesIdTransformer} from './GetKeyframesIdTransformer';
import {ReplaceKeyframesIdTransformer} from './ReplaceKeyframesIdTransformer';

export interface IUniqueKeyframesIdTransformerOptions {

    // 是否带props前缀（一般来说vue不带，其他的都带）
    prefix?: boolean;

    // prefix前缀的名字
    propName?: string;

    idName?: string;
}

export function UniqueKeyframesIdTransformer(options: IUniqueKeyframesIdTransformerOptions): ITransformPlugin {

    const {
        prefix = false,
        propName = 'props',
        idName = 'id'
    } = options;

    return {
        // 进入时记录所有的ID
        enter(info: ISvgInfo): ISvgInfo {

            // 清空映射表
            const map: IReplaceIdTransformerOptions = {};

            const IdMap: {[key: string]: boolean} = {};

            // 获取所有的Id
            info = transform(info, [GetKeyframesIdTransformer(IdMap)]);

            // 生成Id映射（8位就够了，不用那么多）
            Object.keys(IdMap).forEach(key => map[key] = {
                newId: guid().slice(0, 8),
                propName: (prefix ? propName + '.' : '') + idName,
                used: false
            });

            // 替换Id
            info = transform(info, [ReplaceKeyframesIdTransformer(map)]);

            return info;
        }
    };
}
