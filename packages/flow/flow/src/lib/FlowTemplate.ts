/**
 * @file FlowTemplate
 */
import {BaseTemplate, IBoardConfig, IBrickDataGlobal, Scheduler} from '@chief-editor/base';
import {getAbsoluteKey} from '../util/keys';
import {FlowScheduler} from './FlowScheduler';
import {FlowBrick, FlowBrickGlobal} from './FlowBrick';
import {FlowContext} from './FlowContext';
import {FlowModel} from './FlowModel';
import {FlowBoard} from './FlowBoard';

export interface IFlowTemplateOptions {
    id?: string;
    board: IBoardConfig;
    overrideSchedulerOptions?: Partial<Scheduler<any, any, any, any, any>>;
}

export class FlowTemplate extends BaseTemplate<FlowBoard, FlowBrickGlobal> {

    private readonly model: FlowModel;

    private readonly overrideSchedulerOptions: Partial<Scheduler<any, any, any, any, any>>;

    constructor(model: FlowModel, options: IFlowTemplateOptions) {

        super();

        this.model = model;
        this.overrideSchedulerOptions = options.overrideSchedulerOptions || {};

        model.registerTemplate(this.id, this);

        this.node.appendChild(this.createBoard(options.board));

        // todo 暂时Hack
        Object.keys(this.brickMap).forEach(key => {

            const brick = this.brickMap[key];

            if (!brick.ready) {
                this.getOwnerModel().getWatcher().pendingKey(getAbsoluteKey(brick));
            }
        });
    }

    public getOwnerModel(): FlowModel {
        return this.model;
    }

    public getOwnerContext(): FlowContext {
        return this.model.getOwnerContext();
    }

    public dispose(): void {
        super.dispose();
        this.model.unregisterTemplate(this.id);
    }

    protected innerCreateBoard(config: IBoardConfig): FlowBoard {
        return new FlowBoard(this, config);
    }

    protected innerCreateBrick(data: IBrickDataGlobal, board: FlowBoard): FlowBrickGlobal {

        const scheduler = new FlowScheduler({
            brickConfig: this.getOwnerContext().getBrickConfig(data.type),
            model: this.model
        });

        Object.assign(scheduler, this.overrideSchedulerOptions);

        return new FlowBrick(
            board,
            {
                owner: this,
                scheduler,
                data: data
            }
        );
    }
}
