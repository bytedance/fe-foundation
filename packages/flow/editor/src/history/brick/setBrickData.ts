/**
 * @file Brick history
 */
import {Editor, ISetBrickDataCommand} from '@chief-editor/core';

/**
 * 设置组件配置
 * @param data
 * @param editor
 */
export function setBrickData(
    data: ISetBrickDataCommand,
    editor: Editor
): [boolean, ISetBrickDataCommand] {
    const {options, templateId} = data;
    const template = editor.getTemplate(templateId);

    if (!template) {
        return [false, data];
    }
    const res = options.filter(option => {
        const {brickId, data} = option;

        const brick = template.getBrick(brickId);

        if (!brick) {
            return false;
        }

        brick.setData(data);
        // brick.refreshBrick();

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
export function resetSetBrickData(data: ISetBrickDataCommand, editor: Editor): boolean {
    const options = data.options.map(option => ({
        ...option,
        data: option.oldData,
        oldData: option.data
    }));

    const [success] = setBrickData(
        {
            ...data,
            options
        },
        editor
    );

    return success;
}

export default {
    execute: setBrickData,
    reset: resetSetBrickData
};
