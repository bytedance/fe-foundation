/**
 * @file keys 获取Path对应的Keys
 */
import {IBrickGlobal, INodeType, NodeType} from '@chief-editor/base';
import {DomNode} from '@co-hooks/dom-node';
import {NestWatcher} from '@co-hooks/nest-watcher';

// 相对Key用于获取和设置数据
export function getRelativeKeys(node: DomNode<INodeType>): string[] {

    return node.getPathKeys(n => {

        const value = n.getValue();

        if (value.type === NodeType.BRICK || value.type === NodeType.VIRTUAL) {
            return value.field ? value.field : null;
        }

        if (value.type === NodeType.REPEAT) {
            if (n.parentNode) {
                return String(n.parentNode.getIndex(n));
            }
            return value.field;
        }

        return null;
    });
}

export function getRelativeKey(brick: IBrickGlobal): string {
    return NestWatcher.combineKeys(getRelativeKeys(brick.getNode()));
}

// 绝对Key用于Watch，主要是要保证在Repeat里面的子项目可以正确的被相对Watch到
export function getAbsoluteKeys(node: DomNode<INodeType>): string[] {

    return node.getPathKeys(n => {

        const value = n.getValue();

        if (value.type === NodeType.BRICK || value.type === NodeType.VIRTUAL || value.type === NodeType.REPEAT) {
            return value.field ? value.field : null;
        }

        return null;
    });
}

export function getAbsoluteKey(brick: IBrickGlobal): string {
    return NestWatcher.combineKeys(getAbsoluteKeys(brick.getNode()));
}

// 用于寻找当前组件值变更使用的Watch的Key值，
export function getWatchableKeys(node: DomNode<INodeType>): string[] {

    let res: string[] = [];

    node.getPathKeys(n => {

        const value = n.getValue();

        if (value.type === NodeType.VIRTUAL && value.field) {
            res = [];
            return null;
        }

        if (value.type === NodeType.BRICK) {
            value.field && res.unshift(value.field);
        }

        return null;
    });

    return res;
}


export function getWatchableKey(node: DomNode<INodeType>): string {
    return NestWatcher.combineKeys(getWatchableKeys(node));
}
