/**
 * @file OptionGroup
 */
import {EventEmitter} from 'events';
import {guid} from '@co-hooks/util';
import {IOption, Option} from './Option';
import {Select} from './Select';

export interface IOptionGroupOptions {
    title: string;
}

export class OptionGroup<T, P> extends EventEmitter implements IOption {

    private readonly id: string;

    private select: Select<T, P>;

    private readonly parent: OptionGroup<T, P> | null = null;

    private optionMap: { [key: string]: Option<T, P> } = {};

    private groupMap: { [key: string]: OptionGroup<T, P> } = {};

    private title: string = '';

    private disposed: boolean = false;

    constructor(select: Select<T, P>, id?: string, optionGroup?: OptionGroup<T, P>) {
        super();

        this.select = select;
        this.id = id || guid();
        this.parent = optionGroup || null;

        this.select.registerOptionGroup(this);

        if (this.parent) {
            this.parent.registerOptionGroup(this);
        }

        this.setMaxListeners(0);
    }

    public dispose(): void {

        if (this.disposed) {
            return;
        }
        this.select.unregisterOptionGroup(this);

        if (this.parent) {
            this.parent.unregisterOptionGroup(this);
        }

        this.optionMap = {};
        this.groupMap = {};

        this.disposed = true;
    }

    public updateOptionGroupOptions(options: IOptionGroupOptions): void {
        this.title = options.title;
    }

    public registerOption(option: Option<T, P>): void {
        const id = option.getId();

        if (this.optionMap[id]) {
            throw new Error(`id=${id} option component has been registered`);
        }

        this.optionMap[id] = option;
    }

    public unregisterOption(option: Option<T, P>): void {
        const id = option.getId();

        if (!this.optionMap[id]) {
            throw new Error(`id=${id} option component has been registered`);
        }

        delete this.optionMap[id];
    }

    public registerOptionGroup(optionGroup: OptionGroup<T, P>): void {
        const id = optionGroup.getId();

        if (this.optionMap[id]) {
            throw new Error(`id=${id} optionGroup component has been registered`);
        }

        this.groupMap[id] = optionGroup;
    }

    public unregisterOptionGroup(optionGroup: OptionGroup<T, P>): void {
        const id = optionGroup.getId();

        if (!this.groupMap[id]) {
            throw new Error(`id=${id} optionGroup component dose not been registered`);
        }

        delete this.groupMap[id];
    }

    public getOptionIdPath(): string[] {
        const path = [this.id];

        if (!this.parent) {
            return path;
        }

        return this.parent.getOptionIdPath().concat(path);
    }

    public isGroup(): boolean {
        return false;
    }

    public getId(): string {
        return this.id;
    }

    public getTitle(): string {
        return this.title;
    }
}
