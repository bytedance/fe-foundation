/**
 * @file Board 画板类
 */
import {DomNode} from '@co-hooks/dom-node';
import {BaseBoard, BoardType, IBrickDataGlobal, INodeType} from '@chief-editor/base';
import {FlowBrickGlobal} from './FlowBrick';
import {FlowContext} from './FlowContext';
import {FlowModel} from './FlowModel';
import {FlowTemplate} from './FlowTemplate';

export interface IBoardOptions {
    type: BoardType;
    repeat?: boolean;
    part?: string;
    bricks: IBrickDataGlobal[];
}

export class FlowBoard extends BaseBoard {

    public readonly part: string;

    private readonly template: FlowTemplate;

    constructor(template: FlowTemplate, options: IBoardOptions) {

        super(template, options);

        const {part = 'root'} = options;

        this.template = template;
        this.part = part;
    }

    public getBrick(id: string): FlowBrickGlobal {
        return this.getOwnerTemplate().getBrick(id);
    }

    public getNode(): DomNode<INodeType> {
        return this.node;
    }

    public getOwnerTemplate(): FlowTemplate {
        return this.template;
    }

    public getOwnerModel(): FlowModel {
        return this.template.getOwnerModel();
    }

    public getOwnerContext(): FlowContext {
        return this.template.getOwnerContext();
    }
}
