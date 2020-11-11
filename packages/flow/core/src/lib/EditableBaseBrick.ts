/**
 * @file EditableBaseBrick
 */

import {BaseBrick, IBaseBrickOptions} from '@chief-editor/base';
import {DiffType, IBrickPropMergedDiffs, IEditorBrickConfig} from '../types';

export interface IEditorBrickInstanceOptions<V, DS, DP, CG, ST>
    extends Omit<IBaseBrickOptions<V, DS, DP, CG, ST>, 'id'> {
    config: IEditorBrickConfig<V, DS, DP, CG, ST>;
}

export abstract class EditableBaseBrick<V, DS, DP, CG, ST> extends BaseBrick<V, DS, DP, CG, ST> {

    public readonly status: DiffType = DiffType.NONE;

    public readonly diffs?: IBrickPropMergedDiffs;

    private readonly brickConfig: IEditorBrickConfig<V, DS, DP, CG, ST>;

    protected constructor(options: IEditorBrickInstanceOptions<V, DS, DP, CG, ST>) {

        super({
            owner: options.owner,
            data: options.data,
            scheduler: options.scheduler
        });

        const {config} = options;
        this.brickConfig = config;
    }

    public isContainer(): boolean {
        return this.brickConfig.isContainer || false;
    }

    public abstract isActiveBrick(): boolean;

    public abstract setActive(): void;

    public getEditorBrickConfig(): IEditorBrickConfig<V, DS, DP, CG, ST> {
        return this.brickConfig;
    }
}

export type EditableBaseBrickGlobal = EditableBaseBrick<any, any, any, any, any>;
