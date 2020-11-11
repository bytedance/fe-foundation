/**
 * @file PreviewBoard 画板基类
 */

import {BaseBoard, IBoardConfig, IBrickDataGlobal, NodeType} from '@chief-editor/base';
import {DiffType} from '../types';
import {PreviewTemplate} from './PreviewTemplate';
import {PreviewBrickGlobal} from './PreviewBrick';

export class PreviewBoard extends BaseBoard {

    protected readonly template: PreviewTemplate;

    /**
     * 构造函数
     */
    constructor(template: PreviewTemplate, config: IBoardConfig) {
        super(template, config);
        this.template = template;
    }

    public getOwnerTemplate(): PreviewTemplate {
        return this.template;
    }

    /**
     * 获取画板输出数据
     */
    public getCleanRemoveBoardData(cleanId: boolean = false): IBoardConfig {

        let {id, type, floatType} = this;

        return {
            id: cleanId ? '' : id,
            type,
            floatType,
            bricks: this.node.getChildNodes()
                .map(node => this.owner.getBrickByNode(node) as PreviewBrickGlobal)
                .filter(brick => brick.status !== DiffType.REMOVE)
                .map(brick => brick.getCleanRemoveBoardData(cleanId))
        };
    }

    public getBricks(): PreviewBrickGlobal[] {

        const bricks: PreviewBrickGlobal[] = [];

        this.node.getChildNodes().map(child => {
            if (child.getValue().type === NodeType.BRICK) {
                bricks.push(this.template.getBrickByNode(child));
            }
        });

        return bricks;
    }

    /**
     * 新增组件
     * @param data 组件数据
     */
    public addBrick(data: IBrickDataGlobal): PreviewBrickGlobal {

        const node = this.template.createBrick(data, this);
        const brick = this.template.getBrickByNode(node);
        this.node.appendChild(brick.getNode());
        return brick;
    }
}
