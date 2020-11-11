/**
 * @file EditorScheduler
 */
import {
    BaseBrick,
    BrickEnv, IBoardData,
    IBrickData,
    IBrickInfo,
    IBrickPartConfig,
    ISetBrickDataPropertyItem,
    IValidateInfo,
    Scheduler
} from '@chief-editor/base';
import {EditableBaseBrick, IEditorBrickConfig} from '@chief-editor/core';
import {ILayoutConfig} from '@chief-editor/types';
import {FunctionAny, deepClone, guid, setObjectProperty} from '@co-hooks/util';

export interface IEditorSchedulerOptions<V, DS, DP, CG, ST> {
    env: BrickEnv;
    brickConfig: IEditorBrickConfig<V, DS, DP, CG, ST>;
}

export class EditorScheduler<V, DS, DP, CG, ST> implements Scheduler<V, DS, DP, CG, ST> {

    private readonly env: BrickEnv;

    private readonly mockData: DS;

    private readonly brickConfig: IEditorBrickConfig<V, DS, DP, CG, ST>;

    private parts: Record<string, IBoardData> = {};

    constructor(options: IEditorSchedulerOptions<V, DS, DP, CG, ST>) {
        this.env = options.env;
        this.mockData = options.brickConfig.mockData;
        this.brickConfig = options.brickConfig;
    }

    public initBrickData(brick: BaseBrick<V, DS, DP, CG, ST>, data: IBrickData<V, DS, DP, CG, ST>): IBrickInfo {

        Object.assign(this, {brick});

        this.data = data;

        const {
            id = guid(),
            type,
            info,
            parts = {},
            ...extra
        } = data;

        const {
            field,
            label,
            lock = false
        } = info;

        this.parts = parts;
        this.data = {
            id,
            type,
            info,
            ...extra
        };

        return {
            id,
            creator: id,
            label,
            readonly: !field,
            brickType: type,
            field,
            env: this.env,
            virtual: false,
            lock
        };
    }

    public getBrickData(): Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'> {
        return deepClone(this.data);
    }

    public getBuildInHooks(): Record<string, FunctionAny> {
        return this.brickConfig.hooks || {};
    }

    public isPartDynamic(): boolean {
        return this.brickConfig.getPartKeyMapFromBrickData != null;
    }

    public getPartList(): IBrickPartConfig[] {

        const getPartKeyMapFromBrickData = this.brickConfig.getPartKeyMapFromBrickData;
        const parts = this.parts || {};
        const parkKeys = getPartKeyMapFromBrickData ? getPartKeyMapFromBrickData(this.data) : Object.keys(parts);

        if (!parkKeys.length) {
            return [];
        }

        return parkKeys.map(key => ({
            key,
            repeat: false,
            ...(parts[key] || {bricks: []}),
            ...this.brickConfig.getPartBoardInfoFromBrickData(this.data, key)
        }));
    }

    public initStaticBrickData(): void {

        const {data, brick, brickConfig} = this;

        brick.updateBrickInstance({
            state: brickConfig.getInitialState(data)
        }, true);
    }

    public init(): void {
        this.updateInstanceFromData(true);
    }

    public setState(state: Partial<ST>): void {
        this.brick.updateBrickInstance({
            state: {
                ...this.brick.state,
                ...state
            }
        });
    }

    public setValue(value: V, manual?: boolean, isSilent?: boolean): void {

        if (this.brickConfig.setValueToBrickData) {
            this.brickConfig.setValueToBrickData(this.data, value);
            this.updateInstanceFromData(isSilent);
        } else {
            this.brick.updateBrickInstance({
                value
            }, isSilent);
        }
    }

    public updateBrickData(data: Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'>): void {

        data.id = this.brick.id;

        this.data = data;
        this.updateInstanceFromData();
    }

    public setBrickLayout(layout: ILayoutConfig): void {
        this.data.layout = Object.assign({}, this.brick.layout, layout);
        this.brick.updateBrickInstance({layout: this.data.layout});
    }

    private updateInstanceFromData(isSilent: boolean = false): void {

        const {data, brickConfig} = this;

        const {
            info: {
                field,
                label
            },
            type,
            styles,
            layout = brickConfig.getDefaultLayout()
        } = data;

        this.brick.updateBrickInstance({
            label: label || type,
            field,
            readonly: !field,
            value: brickConfig.getValueFromBrickData(data),
            datasource: brickConfig.getDatasourceFromBrickData(data),
            staticDatasource: brickConfig.getDatasourceFromBrickData(data),
            display: brickConfig.getDisplayFromBrickData(data),
            state: brickConfig.mergeStateWithBrickData(this.brick.state, data),
            // todo
            config: data.config as any,
            styles,
            validateInfo: getDefaultValidateInfo(),
            layout,
            loading: false,
            validating: false,
            manual: true,
            ready: true
        }, isSilent);
    }
}

export interface EditorScheduler<V, DS, DP, CG, ST> {
    readonly brick: EditableBaseBrick<V, DS, DP, CG, ST>;
    data: Omit<IBrickData<V, DS, DP, CG, ST>, 'parts'>;
}


export function getDefaultValidateInfo(): IValidateInfo {
    return {
        catchable: false,
        needValidate: false,
        partial: false,
        valid: true,
        error: '',
        children: []
    };
}
