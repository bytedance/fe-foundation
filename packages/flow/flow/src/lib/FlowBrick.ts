/**
 * @file Path 路径操作类
 */

import {
    BaseBrick,
    IBaseBrickOptions
} from '@chief-editor/base';
import {NestWatcher} from '@co-hooks/nest-watcher';
import {getObjectProperty} from '@co-hooks/util';
import {FlowTemplate} from './FlowTemplate';
import {FlowBoard} from './FlowBoard';
import {FlowContext} from './FlowContext';
import {FlowModel} from './FlowModel';

export class FlowBrick<V, DS, DP, CG, ST> extends BaseBrick<V, DS, DP, CG, ST> {

    // region 私有的内置对象引用

    private readonly board: FlowBoard;

    // endregion 私有的内置对象引用

    /**
     * 构造函数
     *
     * @param board 所属画板
     * @param options 配置
     */
    constructor(board: FlowBoard, options: IBaseBrickOptions<V, DS, DP, CG, ST>) {

        super(options);

        this.board = board;
    }

    /**
     * 根据表达式获取数据
     *
     * @param expression 表达式
     */
    public getByExpression(...expression: Array<string | number>): any {

        const args: string[] = [];

        expression.forEach(item => {

            if (typeof item !== 'string') {
                args.push(String(item));
                return;
            }

            args.push(...NestWatcher.splitKey(item));
        });

        const originType = args.shift() || '';
        const type = /^\$/.test(originType) ? originType.slice(1) : originType;
        const path = this;

        // 处理常规类型
        switch (type) {
            case 'context':
                return getObjectProperty(path.getOwnerContext().getContext(args[0], true), args, 1);
            case 'hooks':
                return path.getOwnerContext().getHook(args[0]);
            case 'root':
                return getObjectProperty(path.getOwnerModel().getRootModel().getModelInfo(true), args);
        }

        // todo scope
        //
        //         if (/^scope(\d+)?/.test(type)) {
        //
        //             const level = RegExp.$1 === '' ? (path.readonly ? 0 : 1) : +RegExp.$1;
        //             const keys = path.getNode().getScopeNode(level).getRelativeKeys();
        //
        //             return getObjectProperty(path.getModelInfo(true), [...keys, ...args]);
        //         }
        //
        if (/^model(\d+)?/.test(type)) {

            const level = +RegExp.$1 || 1;
            let model = path.getOwnerModel();

            if (level > 1) {
                model = model.getParentModel(level - 1);
            }

            return getObjectProperty(model.getModelInfo(true), args);
        }
    }

    // endregion 操作非自有属性

    // region 操作自有属性

    public getOwnerBoard(): FlowBoard {
        return this.board;
    }

    public getOwnerTemplate(): FlowTemplate {
        return this.board.getOwnerTemplate();
    }


    /**
     * 获取所属的模型
     *
     * @return
     */
    public getOwnerModel(): FlowModel {
        return this.board.getOwnerModel();
    }

    /**
     * 返回当前Model所处的上下文
     *
     */
    public getOwnerContext(): FlowContext {
        return this.getOwnerModel().getOwnerContext();
    }
}

export type FlowBrickGlobal = FlowBrick<any, any, any, any, any>;
