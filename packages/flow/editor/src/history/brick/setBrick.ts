/**
 * @file Brick history
 */
import {Editor, ISetBrickCommand} from '@chief-editor/core';
import {ILayoutConfig} from '@chief-editor/types';

/**
 * 设置组件配置
 * @param data
 * @param editor
 */
export function setBrick(
    data: ISetBrickCommand,
    editor: Editor
): [boolean, ISetBrickCommand] {
    const {options, templateId} = data;
    const template = editor.getTemplate(templateId);

    if (!template) {
        return [false, data];
    }
    const res = options.filter(option => {

        const {brickId, props} = option;

        const brick = template.getBrick(brickId);

        if (!brick) {
            return false;
        }

        // todo 整体升级
        const layout: ILayoutConfig = {};

        props.forEach(prop => {
            Object.assign(layout, {
                [prop.key.slice(7)]: prop.value
            });
        });

        brick.setBrickLayout(layout);
        return true;
    });

    template.emitChange();

    return [
        !!res.length,
        {
            ...data,
            options: res
        }
    ];
}

/**
 * 回滚属性变更
 * @param data
 * @param editor
 */
export function resetSetBrick(data: ISetBrickCommand, editor: Editor): boolean {
    const options = data.options.map(option => ({
        ...option,
        props: option.props.map(prop => ({
            key: prop.key,
            value: prop.oldValue,
            oldValue: prop.value
        }))
    }));

    const [success] = setBrick(
        {
            ...data,
            options
        },
        editor
    );

    return success;
}

export default {
    execute: setBrick,
    reset: resetSetBrick
};
