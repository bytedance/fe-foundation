/**
 * @file History
 */
import {Emitter} from '@co-hooks/emitter';
import {ICommand, IHistoryExecute} from '../types';
import {Editor} from './Editor';

export interface IHistoryEvent {
    'history-change': [];
}

export class History extends Emitter<IHistoryEvent> {

    private historyPointer: number = 0;

    private historyList: ICommand[] = [];

    private readonly editor: Editor;

    private historyFunctionList: Record<string, IHistoryExecute<any, any>> = {};

    constructor(editor: Editor, list: ICommand[] = []) {
        super();

        this.editor = editor;
        this.historyList = list;
        this.historyPointer = list.length - 1;
    }

    public registerExecute<T, D>(type: string, options: IHistoryExecute<T, D>): void {
        this.historyFunctionList[type] = options;
    }

    public unregisterExecute(type: string): void {
        if (this.historyFunctionList[type]) {
            delete this.historyFunctionList[type];
        }
    }

    public execCommand(command: ICommand, isSilent: boolean = false): boolean {
        const type = command.name;
        const func = this.historyFunctionList[type];

        if (func) {
            const {execute, context} = func;
            const [success, data] = execute(command, context || this.editor);

            if (!isSilent && success) {
                this.addHistory(data);
            }

            return success;
        }

        console.warn(`type = ${command.name} history execute function was not been registered.`);

        return false;
    }

    // 撤销
    public undo(): boolean {
        if (this.isUndoDisabled()) {
            return false;
        }

        const command = this.historyList[this.historyPointer];
        const type = command.name;
        const func = this.historyFunctionList[type];
        let success = false;

        if (func) {
            const {reset, context} = func;
            success = reset(command, context || this.editor);
        } else {
            console.warn(`type = ${command.name} history execute function was not been registered.`);
        }

        if (success) {
            this.historyPointer--;
            this.emit('history-change');
        }

        return success;
    }

    // 重做
    public redo(): boolean {
        if (this.isRedoDisabled()) {
            return false;
        }

        const command = this.historyList[this.historyPointer + 1];
        let success = this.execCommand(command, true);

        if (success) {
            this.historyPointer++;
            this.emit('history-change');
        }

        return success;
    }

    /**
     * 重做
     */
    public isRedoDisabled(): boolean {
        return this.historyPointer === this.historyList.length - 1;
    }

    /**
     * 撤回
     */
    public isUndoDisabled(): boolean {
        return this.historyPointer === -1;
    }

    public addHistory(item: ICommand): void {
        this.historyList = this.historyList.slice(0, Math.min(this.historyPointer + 1, this.historyList.length));
        this.historyList.push(item);
        this.historyPointer = this.historyList.length - 1;

        this.emit('history-change');
    }
}
