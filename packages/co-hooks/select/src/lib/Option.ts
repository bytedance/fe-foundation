/**
 * @file Option
 */
import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import {OptionGroup} from './OptionGroup';
import {Select} from './Select';

export interface IOptionData<T> {
    value: T;
    label: string;
    disabled?: boolean;
    readonly?: boolean;
    selected?: boolean;
}

export enum OptionState {
    SELECTED = 2,
    UNSELECTED = 0
}

export interface IOptionEvent {
    'state-updated': [];
}

export type IOptionType = 'group' | 'option';

export interface IOption {
    getId: () => string;
    getOptionIdPath: () => string[];
    isGroup: () => boolean;
}

export class Option<T, P> extends Emitter<IOptionEvent> implements IOption {

    private readonly id: string;

    private readonly select: Select<T, P>;

    private readonly optionGroup: OptionGroup<T, P> | null = null;

    private data: IOptionData<T>;

    private disposed: boolean = false;

    constructor(select: Select<T, P>, data: IOptionData<T>, id?: string, optionGroup?: OptionGroup<T, P>) {
        super();

        this.id = id || guid();
        this.select = select;
        this.optionGroup = optionGroup || null;

        this.data = data;
        this.updateOption(data);
        this.select.registerOption(this);

        if (this.optionGroup) {
            this.optionGroup.registerOption(this);
        }
    }

    public updateOption(data: IOptionData<T>): void {
        const oldLabel = this.data.label;

        this.data = {
            ...data,
            disabled: !!data.disabled || this.select.isDisabled(),
            readonly: !!data.readonly || this.select.isReadonly(),
            selected: this.select.isSelected(data.value)
        };

        if (oldLabel !== data.label) {
            this.select.waitForCommit('select-label-update');
        }
    }

    public setOptionState(state: OptionState): void {
        const {selected, disabled, readonly} = this.data;

        if (disabled || readonly) {
            return;
        }

        this.select.trySetSelect(this.id, state);

        if (state === OptionState.SELECTED && !selected
            || state === OptionState.UNSELECTED && selected
        ) {
            this.select.setSelect(this.id, state);
        }
    }

    public updateSelected(selected: boolean): void {
        this.data.selected = selected;
        this.stateUpdated();
    }

    public getOptionState(): OptionState {
        if (this.data.selected) {
            return OptionState.SELECTED;
        }

        return OptionState.UNSELECTED;
    }

    public getId(): string {
        return this.id;
    }

    public getData(): IOptionData<T> {
        return this.data;
    }

    public getOptionIdPath(): string[] {
        const path = [this.id];

        if (!this.optionGroup) {
            return path;
        }

        return this.optionGroup.getOptionIdPath().concat(path);
    }

    public isGroup(): boolean {
        return false;
    }

    public stateUpdated(): void {
        this.emit('state-updated');
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        this.select.unregisterOption(this);

        if (this.optionGroup) {
            this.optionGroup.unregisterOption(this);
        }

        this.disposed = true;
    }
}
